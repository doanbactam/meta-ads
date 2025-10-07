import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { auth } from '@clerk/nextjs/server';

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete all data for current user (cascades will handle related records)
    await prisma.adAccount.deleteMany({
      where: { userId: currentUser.id },
    });

    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
