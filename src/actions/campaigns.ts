'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';

// Validation schemas
const duplicateCampaignSchema = z.object({
  id: z.string(),
});

const deleteCampaignSchema = z.object({
  id: z.string(),
});

const updateCampaignStatusSchema = z.object({
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
 * Duplicates a campaign
 */
export async function duplicateCampaignAction(
  input: z.infer<typeof duplicateCampaignSchema>
): Promise<ActionResponse> {
  try {
    // Validate input
    const validated = duplicateCampaignSchema.parse(input);

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
        ...campaign,
        id: undefined, // Let Prisma generate new ID
        name: `${campaign.name} (Copy)`,
        createdAt: undefined,
        updatedAt: undefined,
      },
    });

    revalidatePath('/campaigns');
    return { success: true };
  } catch (error) {
    console.error('Error duplicating campaign:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to duplicate campaign' };
  }
}

/**
 * Deletes a campaign
 */
export async function deleteCampaignAction(
  input: z.infer<typeof deleteCampaignSchema>
): Promise<ActionResponse> {
  try {
    // Validate input
    const validated = deleteCampaignSchema.parse(input);

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Delete campaign
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
    return { success: false, error: 'Failed to delete campaign' };
  }
}

/**
 * Updates a campaign status
 */
export async function updateCampaignStatusAction(
  input: z.infer<typeof updateCampaignStatusSchema>
): Promise<ActionResponse> {
  try {
    // Validate input
    const validated = updateCampaignStatusSchema.parse(input);

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

    revalidatePath('/campaigns');
    return { success: true };
  } catch (error) {
    console.error('Error updating campaign status:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to update campaign status' };
  }
}
