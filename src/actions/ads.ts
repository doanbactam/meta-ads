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

    // Get the original creative
    const creative = await prisma.creative.findUnique({
      where: { id: validated.id },
    });

    if (!creative) {
      return { success: false, error: 'Ad not found' };
    }

    // Create duplicate
    await prisma.creative.create({
      data: {
        adGroupId: creative.adGroupId,
        name: `${creative.name} (Copy)`,
        format: creative.format,
        status: creative.status,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        engagement: 0,
        spend: 0,
        roas: 0,
        dateStart: creative.dateStart,
        dateEnd: creative.dateEnd,
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

    // Delete creative
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

    // Update creative status
    await prisma.creative.update({
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
