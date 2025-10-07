'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { FacebookSDKClient } from '@/lib/server/facebook-sdk-client';
import { CacheManager } from '@/lib/server/cache-manager';
import { FacebookErrorHandler, FACEBOOK_API_CONFIG } from '@/lib/integrations/facebook';

// Validation schemas
const duplicateAdSchema = z.object({
  id: z.string(),
});

const deleteAdSchema = z.object({
  id: z.string(),
});

const updateAdStatusSchema = z.object({
  id: z.string(),
  status: z.enum([
    'ACTIVE',
    'PAUSED',
    'DELETED',
    'ARCHIVED',
    'PENDING',
    'REVIEW',
    'REJECTED',
    'DISAPPROVED',
  ]),
});

// Type for action responses
type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Duplicates an ad using Facebook SDK
 */
export async function duplicateAdAction(
  input: z.infer<typeof duplicateAdSchema>
): Promise<ActionResponse> {
  const errorHandler = new FacebookErrorHandler();
  
  try {
    // Validate input
    const validated = duplicateAdSchema.parse(input);

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get the original creative with related data
    const creative = await prisma.creative.findUnique({
      where: { id: validated.id },
      include: {
        adGroup: {
          include: {
            campaign: {
              include: {
                adAccount: true,
              },
            },
          },
        },
      },
    });

    if (!creative) {
      return { success: false, error: 'Ad not found' };
    }

    if (!creative.facebookAdId) {
      return { success: false, error: 'Ad not synced with Facebook' };
    }

    if (!creative.adGroup.campaign.adAccount.facebookAccessToken) {
      return { success: false, error: 'Facebook account not connected' };
    }

    // Initialize Facebook SDK Client and Cache
    const sdkClient = new FacebookSDKClient({
      accessToken: creative.adGroup.campaign.adAccount.facebookAccessToken,
      apiVersion: FACEBOOK_API_CONFIG.apiVersion,
    });
    const cacheManager = new CacheManager(1000);

    // Duplicate ad via Facebook SDK with retry logic
    const result = await errorHandler.handleWithRetry(async () => {
      // Get original ad details from Facebook
      const originalAd = await sdkClient.getAd(
        creative.facebookAdId!,
        ['name', 'status', 'creative', 'adset_id']
      );

      // Create duplicate on Facebook
      if (!originalAd.creative?.id) {
        throw new Error('Original ad has no creative');
      }
      
      const duplicatedAd = await sdkClient.createAd(
        originalAd.adset_id!,
        {
          name: `${originalAd.name} (Copy)`,
          adset_id: originalAd.adset_id!,
          status: 'PAUSED' as any, // Start as paused for safety
          creative: { creative_id: originalAd.creative.id },
        }
      );

      return duplicatedAd;
    });

    // Save to local database
    await prisma.creative.create({
      data: {
        adGroupId: creative.adGroupId,
        facebookAdId: result.id,
        name: result.name,
        format: creative.format,
        status: result.status as any,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        engagement: 0,
        spend: 0,
        roas: 0,
        dateStart: creative.dateStart,
        dateEnd: creative.dateEnd,
        facebookCreatedTime: result.created_time ? new Date(result.created_time) : null,
      } as any, // Cast to avoid Prisma client type issues
    });

    // Invalidate cache
    if (creative.adGroup.facebookAdSetId) {
      await cacheManager.invalidateAds(creative.adGroup.facebookAdSetId);
    }

    revalidatePath('/ads');
    return { success: true };
  } catch (error) {
    console.error('Error duplicating ad:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    
    // Use error handler to get user-friendly message
    if (error && typeof error === 'object' && 'getUserMessage' in error) {
      return { success: false, error: (error as any).getUserMessage() };
    }
    
    return { success: false, error: 'Failed to duplicate ad' };
  }
}

/**
 * Deletes an ad from Facebook and local database
 */
export async function deleteAdAction(
  input: z.infer<typeof deleteAdSchema>
): Promise<ActionResponse> {
  const errorHandler = new FacebookErrorHandler();
  
  try {
    // Validate input
    const validated = deleteAdSchema.parse(input);

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get creative with related data
    const creative = await prisma.creative.findUnique({
      where: { id: validated.id },
      include: {
        adGroup: {
          include: {
            campaign: {
              include: {
                adAccount: true,
              },
            },
          },
        },
      },
    });

    if (!creative) {
      return { success: false, error: 'Ad not found' };
    }

    // Initialize cache
    const cacheManager = new CacheManager(1000);

    // Delete from Facebook if synced
    if (creative.facebookAdId && creative.adGroup.campaign.adAccount.facebookAccessToken) {
      const sdkClient = new FacebookSDKClient({
        accessToken: creative.adGroup.campaign.adAccount.facebookAccessToken,
        apiVersion: FACEBOOK_API_CONFIG.apiVersion,
      });

      await errorHandler.handleWithRetry(async () => {
        await sdkClient.deleteAd(creative.facebookAdId!);
      });

      // Invalidate cache
      if (creative.adGroup.facebookAdSetId) {
        await cacheManager.invalidateAds(creative.adGroup.facebookAdSetId);
      }
    }

    // Delete from local database
    await prisma.creative.delete({
      where: { id: validated.id },
    });

    revalidatePath('/ads');
    return { success: true };
  } catch (error) {
    console.error('Error deleting ad:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    
    // Use error handler to get user-friendly message
    if (error && typeof error === 'object' && 'getUserMessage' in error) {
      return { success: false, error: (error as any).getUserMessage() };
    }
    
    return { success: false, error: 'Failed to delete ad' };
  }
}

/**
 * Updates an ad status on Facebook and local database
 */
export async function updateAdStatusAction(
  input: z.infer<typeof updateAdStatusSchema>
): Promise<ActionResponse> {
  const errorHandler = new FacebookErrorHandler();
  
  try {
    // Validate input
    const validated = updateAdStatusSchema.parse(input);

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get creative with related data
    const creative = await prisma.creative.findUnique({
      where: { id: validated.id },
      include: {
        adGroup: {
          include: {
            campaign: {
              include: {
                adAccount: true,
              },
            },
          },
        },
      },
    });

    if (!creative) {
      return { success: false, error: 'Ad not found' };
    }

    // Initialize cache
    const cacheManager = new CacheManager(1000);

    // Update on Facebook if synced
    if (creative.facebookAdId && creative.adGroup.campaign.adAccount.facebookAccessToken) {
      const sdkClient = new FacebookSDKClient({
        accessToken: creative.adGroup.campaign.adAccount.facebookAccessToken,
        apiVersion: FACEBOOK_API_CONFIG.apiVersion,
      });

      await errorHandler.handleWithRetry(async () => {
        await sdkClient.updateAd(creative.facebookAdId!, {
          status: validated.status as any,
        });
      });

      // Invalidate cache
      if (creative.adGroup.facebookAdSetId) {
        await cacheManager.invalidateAds(creative.adGroup.facebookAdSetId);
      }
    }

    // Update local database
    await prisma.creative.update({
      where: { id: validated.id },
      data: { 
        status: validated.status as any, // Cast to avoid type issues
      },
    });

    revalidatePath('/ads');
    return { success: true };
  } catch (error) {
    console.error('Error updating ad status:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    
    // Use error handler to get user-friendly message
    if (error && typeof error === 'object' && 'getUserMessage' in error) {
      return { success: false, error: (error as any).getUserMessage() };
    }
    
    return { success: false, error: 'Failed to update ad status' };
  }
}
