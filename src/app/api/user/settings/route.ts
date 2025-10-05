import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';
import { prisma } from '@/lib/server/prisma';

export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUserFromClerk(clerkId);

    return NextResponse.json({
      preferredCurrency: user.preferredCurrency,
      preferredLocale: user.preferredLocale,
      preferredTimezone: user.preferredTimezone,
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { preferredCurrency, preferredLocale, preferredTimezone } = body;

    // Validate currency code
    if (preferredCurrency && typeof preferredCurrency !== 'string') {
      return NextResponse.json({ error: 'Invalid currency code' }, { status: 400 });
    }

    // Validate locale code
    if (preferredLocale && typeof preferredLocale !== 'string') {
      return NextResponse.json({ error: 'Invalid locale code' }, { status: 400 });
    }

    // Validate timezone
    if (preferredTimezone && typeof preferredTimezone !== 'string') {
      return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
    }

    const user = await getOrCreateUserFromClerk(clerkId);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(preferredCurrency && { preferredCurrency }),
        ...(preferredLocale && { preferredLocale }),
        ...(preferredTimezone && { preferredTimezone }),
      },
    });

    return NextResponse.json({
      preferredCurrency: updatedUser.preferredCurrency,
      preferredLocale: updatedUser.preferredLocale,
      preferredTimezone: updatedUser.preferredTimezone,
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
}