import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAdAccountById } from '@/lib/server/api/ad-accounts';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';
import { prisma } from '@/lib/server/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const user = await getOrCreateUserFromClerk(clerkId);
    
    // Verify user has access to this ad account
    const adAccount = await prisma.adAccount.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!adAccount) {
      return NextResponse.json({ error: 'Ad account not found' }, { status: 404 });
    }

    const account = await getAdAccountById(id);

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error fetching ad account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ad account' },
      { status: 500 }
    );
  }
}