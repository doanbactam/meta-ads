'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';

// Validation schemas
const duplicateAdSchema = z.object({
  id: z.string(),
});

const deleteAdSchema = z.object({
  id: z.string(),
});

const updateAdStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['Eligible', 'Paused', 'Disapproved', 'Pending', 'Ended', 'Removed']),
});

// Type for action responses
type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Duplicates an ad
 */
export async function duplicateAdAction(
  input: z.infer<typeof duplicateAdSchema>
): Promise<ActionResponse> {
  try {
    // Validate input
    const validated = duplicateAdSchema.parse(input);

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get the original campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: validated.id },
    });

    if (!campaign) {
      return { success: false, error: 'Campaign not found' };
    }

    // Create duplicate
    await prisma.campaign.create({
      data: {
        adAccountId: campaign.adAccountId,
        name: `${campaign.name} (Copy)`,
        status: campaign.status,
        budget: campaign.budget,
        spent: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        conversions: 0,
        costPerConversion: 0,
        dateStart: campaign.dateStart,
        dateEnd: campaign.dateEnd,
        schedule: campaign.schedule,
      },
    });

    revalidatePath('/ads');
    return { success: true };
  } catch (error) {
    console.error('Error duplicating ad:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to duplicate ad' };
  }
}

/**
 * Deletes an ad
 */
export async function deleteAdAction(
  input: z.infer<typeof deleteAdSchema>
): Promise<ActionResponse> {
  try {
    // Validate input
    const validated = deleteAdSchema.parse(input);

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Delete campaign
    await prisma.campaign.delete({
      where: { id: validated.id },
    });

    revalidatePath('/ads');
    return { success: true };
  } catch (error) {
    console.error('Error deleting ad:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to delete ad' };
  }
}

/**
 * Updates an ad status
 */
export async function updateAdStatusAction(
  input: z.infer<typeof updateAdStatusSchema>
): Promise<ActionResponse> {
  try {
    // Validate input
    const validated = updateAdStatusSchema.parse(input);

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update campaign status
    await prisma.campaign.update({
      where: { id: validated.id },
      data: { status: validated.status },
    });

    revalidatePath('/ads');
    return { success: true };
  } catch (error) {
    console.error('Error updating ad status:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to update ad status' };
  }
}
