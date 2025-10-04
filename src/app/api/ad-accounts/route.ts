import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAdAccounts } from '@/lib/api/ad-accounts';
import { getOrCreateUserFromClerk } from '@/lib/api/users';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUserFromClerk(clerkId);
    const accounts = await getAdAccounts(user.id);

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching ad accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ad accounts' },
      { status: 500 }
    );
  }
}
