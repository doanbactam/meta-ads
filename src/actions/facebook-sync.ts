'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { FacebookSDKClient } from '@/lib/server/facebook-sdk-client';
import { getCacheManager } from '@/lib/server/cache';
import { FacebookErrorHandler, FACEBOOK_API_CONFIG, FACEBOOK_FIELDS } from '@/lib/integrations/facebook';
import { getPlainFacebookToken } from '@/lib/server/token-utils';

// Validation schemas
const syncAdAccountSchema = z.object({
  adAccountId: z.string(),
});

const syncCampaignsSchema = z.object({
  adAccountId: z.string(),
  campaignIds: z.array(z.string()).optional(), // If not provided, sync all campaigns
});

// Type for action responses
type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

/**
 * Syncs ad account data from Facebook
 * Requirements: 1.1, 1.2
 */
export async function syncAdAccountAction(
  input: z.infer<typeof syncAdAccountSchema>
): Promise<ActionResponse<{ synced: number }>> {
  const errorHandler = new FacebookErrorHandler();
  
  try {
    // Validate input
    const validated = syncAdAccountSchema.parse(input);

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get ad account from database
    const adAccount = await prisma.adAccount.findUnique({
      where: { id: validated.adAccountId },
      include: { user: true },
    });

    if (!adAccount) {
      return { success: false, error: 'Ad account not found' };
    }

    // Verify user owns this ad account
    if (adAccount.user.clerkId !== userId) {
      return { success: false, error: 'Unauthorized access to ad account' };
    }

    if (!adAccount.facebookAccessToken) {
      return { success: false, error: 'Facebook account not connected' };
    }

    if (!adAccount.facebookAdAccountId) {
      return { success: false, error: 'Facebook ad account ID not found' };
    }

    const tokenResult = getPlainFacebookToken(adAccount.facebookAccessToken);

    if (!tokenResult.token) {
      return {
        success: false,
        error: tokenResult.error || 'Stored Facebook token is invalid. Please reconnect.',
      };
    }

    // Initialize Facebook SDK Client and Cache
    const cacheManager = getCacheManager();
    const sdkClient = new FacebookSDKClient({
      accessToken: tokenResult.token,
      apiVersion: FACEBOOK_API_CONFIG.apiVersion,
      cacheManager,
      userId: adAccount.userId,
    });

    // Update sync status
    await prisma.adAccount.update({
      where: { id: validated.adAccountId },
      data: { 
        syncStatus: 'SYNCING',
        syncError: null,
      },
    });

    // Fetch ad account data from Facebook with retry logic
    const fbAdAccount = await errorHandler.handleWithRetry(async () => {
      return await sdkClient.getAdAccount(adAccount.facebookAdAccountId!);
    });

    // Update ad account in database
    await prisma.adAccount.update({
      where: { id: validated.adAccountId },
      data: {
        name: fbAdAccount.name,
        currency: fbAdAccount.currency,
        timeZone: fbAdAccount.timezone_name || 'UTC',
        facebookBusinessId: fbAdAccount.business?.id,
        facebookAccessType: fbAdAccount.access_type,
        lastSyncedAt: new Date(),
        syncStatus: 'IDLE',
      },
    });

    // Invalidate cache
    cacheManager.invalidateAdAccounts(adAccount.userId);

    revalidatePath('/dashboard');
    return { 
      success: true, 
      data: { synced: 1 },
      message: 'Ad account synced successfully',
    };
  } catch (error) {
    console.error('Error syncing ad account:', error);
    
    // Update sync status to error
    try {
      await prisma.adAccount.update({
        where: { id: input.adAccountId },
        data: { 
          syncStatus: 'ERROR',
          syncError: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (updateError) {
      console.error('Error updating sync status:', updateError);
    }

    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    
    // Use error handler to get user-friendly message
    if (error && typeof error === 'object' && 'getUserMessage' in error) {
      return { success: false, error: (error as any).getUserMessage() };
    }
    
    return { success: false, error: 'Failed to sync ad account' };
  }
}

/**
 * Syncs campaigns from Facebook
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export async function syncCampaignsAction(
  input: z.infer<typeof syncCampaignsSchema>
): Promise<ActionResponse<{ synced: number; created: number; updated: number }>> {
  const errorHandler = new FacebookErrorHandler();
  
  try {
    // Validate input
    const validated = syncCampaignsSchema.parse(input);

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get ad account from database
    const adAccount = await prisma.adAccount.findUnique({
      where: { id: validated.adAccountId },
      include: { user: true },
    });

    if (!adAccount) {
      return { success: false, error: 'Ad account not found' };
    }

    // Verify user owns this ad account
    if (adAccount.user.clerkId !== userId) {
      return { success: false, error: 'Unauthorized access to ad account' };
    }

    if (!adAccount.facebookAccessToken) {
      return { success: false, error: 'Facebook account not connected' };
    }

    if (!adAccount.facebookAdAccountId) {
      return { success: false, error: 'Facebook ad account ID not found' };
    }

    // Initialize Facebook SDK Client and Cache
    const cacheManager = getCacheManager();
    const tokenResult = getPlainFacebookToken(adAccount.facebookAccessToken);

    if (!tokenResult.token) {
      return {
        success: false,
        error: tokenResult.error || 'Stored Facebook token is invalid. Please reconnect.',
      };
    }

    const sdkClient = new FacebookSDKClient({
      accessToken: tokenResult.token,
      apiVersion: FACEBOOK_API_CONFIG.apiVersion,
      cacheManager,
      userId: adAccount.userId,
    });

    // Update sync status
    await prisma.adAccount.update({
      where: { id: validated.adAccountId },
      data: { 
        syncStatus: 'SYNCING',
        syncError: null,
      },
    });

    // Fetch campaigns from Facebook with retry logic
    const fbCampaigns = await errorHandler.handleWithRetry(async () => {
      return await sdkClient.getCampaigns(adAccount.facebookAdAccountId!, {
        fields: [...FACEBOOK_FIELDS.campaign], // Convert readonly array to mutable
      });
    });

    let created = 0;
    let updated = 0;

    // Sync each campaign
    for (const fbCampaign of fbCampaigns) {
      // Check if campaign exists in database
      const existingCampaign = await prisma.campaign.findFirst({
        where: {
          facebookCampaignId: fbCampaign.id,
          adAccountId: validated.adAccountId,
        },
      });

      const campaignData = {
        name: fbCampaign.name,
        status: fbCampaign.status as any,
        dailyBudget: fbCampaign.daily_budget ? parseFloat(fbCampaign.daily_budget) : null,
        lifetimeBudget: fbCampaign.lifetime_budget ? parseFloat(fbCampaign.lifetime_budget) : null,
        spendCap: fbCampaign.spend_cap ? parseFloat(fbCampaign.spend_cap) : null,
        budgetRemaining: fbCampaign.budget_remaining ? parseFloat(fbCampaign.budget_remaining) : null,
        bidStrategy: fbCampaign.bid_strategy,
        specialAdCategories: fbCampaign.special_ad_categories || [],
        facebookCreatedTime: fbCampaign.created_time ? new Date(fbCampaign.created_time) : null,
        facebookUpdatedTime: fbCampaign.updated_time ? new Date(fbCampaign.updated_time) : null,
        startTime: fbCampaign.start_time ? new Date(fbCampaign.start_time) : null,
        stopTime: fbCampaign.stop_time ? new Date(fbCampaign.stop_time) : null,
        lastSyncedAt: new Date(),
      };

      if (existingCampaign) {
        // Update existing campaign
        await prisma.campaign.update({
          where: { id: existingCampaign.id },
          data: campaignData as any,
        });
        updated++;
      } else {
        // Create new campaign
        await prisma.campaign.create({
          data: {
            ...campaignData,
            adAccountId: validated.adAccountId,
            facebookCampaignId: fbCampaign.id,
            budget: fbCampaign.daily_budget ? parseFloat(fbCampaign.daily_budget) : 0, // Legacy field
            dateStart: fbCampaign.start_time ? new Date(fbCampaign.start_time) : new Date(),
            dateEnd: fbCampaign.stop_time ? new Date(fbCampaign.stop_time) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          } as any,
        });
        created++;
      }
    }

    // Update sync status
    await prisma.adAccount.update({
      where: { id: validated.adAccountId },
      data: { 
        syncStatus: 'IDLE',
        lastSyncedAt: new Date(),
      },
    });

    // Invalidate cache
    if (adAccount.facebookAdAccountId) {
      cacheManager.invalidateCampaigns(adAccount.userId, adAccount.facebookAdAccountId);
    }
    revalidateTag(`campaigns-${validated.adAccountId}`);

    revalidatePath('/campaigns');
    return { 
      success: true, 
      data: { 
        synced: fbCampaigns.length,
        created,
        updated,
      },
      message: `Synced ${fbCampaigns.length} campaigns (${created} created, ${updated} updated)`,
    };
  } catch (error) {
    console.error('Error syncing campaigns:', error);
    
    // Update sync status to error
    try {
      await prisma.adAccount.update({
        where: { id: input.adAccountId },
        data: { 
          syncStatus: 'ERROR',
          syncError: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (updateError) {
      console.error('Error updating sync status:', updateError);
    }

    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    
    // Use error handler to get user-friendly message
    if (error && typeof error === 'object' && 'getUserMessage' in error) {
      return { success: false, error: (error as any).getUserMessage() };
    }
    
    return { success: false, error: 'Failed to sync campaigns' };
  }
}
