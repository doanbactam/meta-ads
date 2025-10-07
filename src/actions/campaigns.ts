'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { FacebookSDKClient } from '@/lib/server/facebook-sdk-client';
import { CacheManager } from '@/lib/server/cache-manager';
import { FacebookErrorHandler, FACEBOOK_API_CONFIG } from '@/lib/integrations/facebook';

// Validation schemas
const duplicateCampaignSchema = z.object({
  id: z.string(),
});

const deleteCampaignSchema = z.object({
  id: z.string(),
});

const updateCampaignStatusSchema = z.object({
  id: z.string(),
  status: z.enum([
    'ACTIVE',
    'PAUSED',
    'DELETED',
    'ARCHIVED',
    'PENDING',
    'ENDED',
    'DISAPPROVED',
    'REMOVED',
  ]),
});

// Type for action responses
type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Duplicates a campaign using Facebook SDK
 */
export async function duplicateCampaignAction(
  input: z.infer<typeof duplicateCampaignSchema>
): Promise<ActionResponse> {
  const errorHandler = new FacebookErrorHandler();
  
  try {
    // Validate input
    const validated = duplicateCampaignSchema.parse(input);

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get the original campaign from database with ad account
    const campaign = await prisma.campaign.findUnique({
      where: { id: validated.id },
      include: { adAccount: true },
    });

    if (!campaign) {
      return { success: false, error: 'Campaign not found' };
    }

    if (!campaign.facebookCampaignId) {
      return { success: false, error: 'Campaign not synced with Facebook' };
    }

    if (!campaign.adAccount.facebookAccessToken) {
      return { success: false, error: 'Facebook account not connected' };
    }

    // Initialize Facebook SDK Client and Cache
    const sdkClient = new FacebookSDKClient({
      accessToken: campaign.adAccount.facebookAccessToken,
      apiVersion: FACEBOOK_API_CONFIG.apiVersion,
    });
    const cacheManager = new CacheManager(1000);

    // Duplicate campaign via Facebook SDK with retry logic
    const result = await errorHandler.handleWithRetry(async () => {
      // Get original campaign details from Facebook
      const originalCampaign = await sdkClient.getCampaign(
        campaign.facebookCampaignId!,
        ['name', 'objective', 'status', 'daily_budget', 'lifetime_budget', 'bid_strategy', 'special_ad_categories']
      );

      // Create duplicate on Facebook
      const duplicatedCampaign = await sdkClient.createCampaign(
        campaign.adAccount.facebookAdAccountId!,
        {
          name: `${originalCampaign.name} (Copy)`,
          objective: originalCampaign.objective!,
          status: 'PAUSED' as any, // Start as paused for safety
          daily_budget: originalCampaign.daily_budget,
          lifetime_budget: originalCampaign.lifetime_budget,
          bid_strategy: originalCampaign.bid_strategy,
          special_ad_categories: originalCampaign.special_ad_categories,
        }
      );

      return duplicatedCampaign;
    });

    // Save to local database
    await prisma.campaign.create({
      data: {
        adAccountId: campaign.adAccountId,
        facebookCampaignId: result.id,
        name: result.name,
        status: result.status as any, // Cast to avoid type issues until Prisma regenerates
        dailyBudget: result.daily_budget ? parseFloat(result.daily_budget) : null,
        lifetimeBudget: result.lifetime_budget ? parseFloat(result.lifetime_budget) : null,
        bidStrategy: result.bid_strategy,
        specialAdCategories: result.special_ad_categories || [],
        facebookCreatedTime: result.created_time ? new Date(result.created_time) : null,
        budget: result.daily_budget ? parseFloat(result.daily_budget) : 0, // Legacy field
        dateStart: new Date(),
        dateEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      } as any, // Cast entire object to avoid Prisma client type issues
    });

    // Invalidate cache
    await cacheManager.invalidateCampaigns(campaign.adAccount.facebookAdAccountId!);

    revalidatePath('/campaigns');
    return { success: true };
  } catch (error) {
    console.error('Error duplicating campaign:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    
    // Use error handler to get user-friendly message
    if (error && typeof error === 'object' && 'getUserMessage' in error) {
      return { success: false, error: (error as any).getUserMessage() };
    }
    
    return { success: false, error: 'Failed to duplicate campaign' };
  }
}

/**
 * Deletes a campaign from Facebook and local database
 */
export async function deleteCampaignAction(
  input: z.infer<typeof deleteCampaignSchema>
): Promise<ActionResponse> {
  const errorHandler = new FacebookErrorHandler();
  
  try {
    // Validate input
    const validated = deleteCampaignSchema.parse(input);

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get campaign from database with ad account
    const campaign = await prisma.campaign.findUnique({
      where: { id: validated.id },
      include: { adAccount: true },
    });

    if (!campaign) {
      return { success: false, error: 'Campaign not found' };
    }

    // Initialize cache
    const cacheManager = new CacheManager(1000);

    // Delete from Facebook if synced
    if (campaign.facebookCampaignId && campaign.adAccount.facebookAccessToken) {
      const sdkClient = new FacebookSDKClient({
        accessToken: campaign.adAccount.facebookAccessToken,
        apiVersion: FACEBOOK_API_CONFIG.apiVersion,
      });

      await errorHandler.handleWithRetry(async () => {
        await sdkClient.deleteCampaign(campaign.facebookCampaignId!);
      });

      // Invalidate cache
      if (campaign.adAccount.facebookAdAccountId) {
        await cacheManager.invalidateCampaigns(campaign.adAccount.facebookAdAccountId);
      }
    }

    // Delete from local database
    await prisma.campaign.delete({
      where: { id: validated.id },
    });

    revalidatePath('/campaigns');
    return { success: true };
  } catch (error) {
    console.error('Error deleting campaign:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    
    // Use error handler to get user-friendly message
    if (error && typeof error === 'object' && 'getUserMessage' in error) {
      return { success: false, error: (error as any).getUserMessage() };
    }
    
    return { success: false, error: 'Failed to delete campaign' };
  }
}

/**
 * Updates a campaign status on Facebook and local database
 */
export async function updateCampaignStatusAction(
  input: z.infer<typeof updateCampaignStatusSchema>
): Promise<ActionResponse> {
  const errorHandler = new FacebookErrorHandler();
  
  try {
    // Validate input
    const validated = updateCampaignStatusSchema.parse(input);

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get campaign from database with ad account
    const campaign = await prisma.campaign.findUnique({
      where: { id: validated.id },
      include: { adAccount: true },
    });

    if (!campaign) {
      return { success: false, error: 'Campaign not found' };
    }

    // Initialize cache
    const cacheManager = new CacheManager(1000);

    // Update on Facebook if synced
    if (campaign.facebookCampaignId && campaign.adAccount.facebookAccessToken) {
      const sdkClient = new FacebookSDKClient({
        accessToken: campaign.adAccount.facebookAccessToken,
        apiVersion: FACEBOOK_API_CONFIG.apiVersion,
      });

      await errorHandler.handleWithRetry(async () => {
        await sdkClient.updateCampaign(campaign.facebookCampaignId!, {
          status: validated.status as any,
        });
      });

      // Invalidate cache
      if (campaign.adAccount.facebookAdAccountId) {
        await cacheManager.invalidateCampaigns(campaign.adAccount.facebookAdAccountId);
      }
    }

    // Update local database
    await prisma.campaign.update({
      where: { id: validated.id },
      data: { 
        status: validated.status as any, // Cast to avoid type issues until Prisma regenerates
      },
    });

    revalidatePath('/campaigns');
    return { success: true };
  } catch (error) {
    console.error('Error updating campaign status:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    
    // Use error handler to get user-friendly message
    if (error && typeof error === 'object' && 'getUserMessage' in error) {
      return { success: false, error: (error as any).getUserMessage() };
    }
    
    return { success: false, error: 'Failed to update campaign status' };
  }
}
