import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { duplicateAdGroup } from '@/lib/api/ad-groups';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const adSet = await duplicateAdGroup(id);

    return NextResponse.json({ adSet });
  } catch (error) {
    console.error('Error duplicating ad set:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate ad set' },
      { status: 500 }
    );
  }
}
