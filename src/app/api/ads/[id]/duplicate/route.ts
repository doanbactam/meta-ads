import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { duplicateCreative } from '@/lib/server/api/creatives';

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
    const ad = await duplicateCreative(id);

    return NextResponse.json({ ad });
  } catch (error) {
    console.error('Error duplicating ad:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate ad' },
      { status: 500 }
    );
  }
}
