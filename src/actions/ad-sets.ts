'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';

// Validation schemas
const duplicateAdSetSchema = z.object({
  id: z.string(),
});

const deleteAdSetSchema = z.object({
  id: z.string(),
});

const updateAdSetStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED', 'PENDING', 'ENDED']),
});

// Type for action responses
type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Duplicates an ad set
 */
export async function duplicateAdSetAction(
  input: z.infer<typeof duplicateAdSetSchema>
): Promise<ActionResponse> {
  try {
    // Validate input
    const validated = duplicateAdSetSchema.parse(input);

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get the original ad set
    const adSet = await prisma.adGroup.findUnique({
      where: { id: validated.id },
    });

    if (!adSet) {
      return { success: false, error: 'Ad set not found' };
    }

    // Create duplicate
    await prisma.adGroup.create({
      data: {
        ...adSet,
        id: undefined, // Let Prisma generate new ID
        name: `${adSet.name} (Copy)`,
        createdAt: undefined,
        updatedAt: undefined,
      },
    });

    revalidatePath('/ad-sets');
    return { success: true };
  } catch (error) {
    console.error('Error duplicating ad set:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to duplicate ad set' };
  }
}

/**
 * Deletes an ad set
 */
export async function deleteAdSetAction(
  input: z.infer<typeof deleteAdSetSchema>
): Promise<ActionResponse> {
  try {
    // Validate input
    const validated = deleteAdSetSchema.parse(input);

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Delete ad set
    await prisma.adGroup.delete({
      where: { id: validated.id },
    });

    revalidatePath('/ad-sets');
    return { success: true };
  } catch (error) {
    console.error('Error deleting ad set:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to delete ad set' };
  }
}

/**
 * Updates an ad set status
 */
export async function updateAdSetStatusAction(
  input: z.infer<typeof updateAdSetStatusSchema>
): Promise<ActionResponse> {
  try {
    // Validate input
    const validated = updateAdSetStatusSchema.parse(input);

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update ad set status
    await prisma.adGroup.update({
      where: { id: validated.id },
      data: { status: validated.status },
    });

    revalidatePath('/ad-sets');
    return { success: true };
  } catch (error) {
    console.error('Error updating ad set status:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to update ad set status' };
  }
}
