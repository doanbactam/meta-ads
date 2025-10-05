import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { type NextRequest, NextResponse } from 'next/server';
import { getAdAccounts } from '@/lib/server/api/ad-accounts';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to view ad accounts' },
        { status: 401 }
      );
    }

    const user = await getOrCreateUserFromClerk(clerkId);
    const accounts = await getAdAccounts(user.id);

    return NextResponse.json({
      accounts,
      count: accounts.length,
    });
  } catch (error) {
    console.error('Error fetching ad accounts:', error);

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Ad accounts not found', message: 'No ad accounts found for this user' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to query ad accounts from database' },
        { status: 500 }
      );
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Invalid data format in database. Please contact support.',
        },
        { status: 500 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      {
        error: 'Failed to fetch ad accounts',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
