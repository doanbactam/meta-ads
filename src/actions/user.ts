'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';

// Validation schemas
const updateUserSettingsSchema = z.object({
  currency: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
});

const updateUserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifications: z.boolean().optional(),
});

// Type for action responses
type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Updates user settings (currency, locale, timezone)
 */
export async function updateUserSettingsAction(
  input: z.infer<typeof updateUserSettingsSchema>
): Promise<ActionResponse> {
  try {
    // Validate input
    const validated = updateUserSettingsSchema.parse(input);

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update user settings
    await prisma.user.update({
      where: { clerkId: userId },
      data: validated,
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating user settings:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to update user settings' };
  }
}

/**
 * Updates user preferences (theme, notifications)
 */
export async function updateUserPreferencesAction(
  input: z.infer<typeof updateUserPreferencesSchema>
): Promise<ActionResponse> {
  try {
    // Validate input
    const validated = updateUserPreferencesSchema.parse(input);

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update user preferences
    await prisma.user.update({
      where: { clerkId: userId },
      data: validated,
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating user preferences:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to update user preferences' };
  }
}
