import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { duplicateCampaign } from '@/lib/server/api/campaigns';

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
    const campaign = await duplicateCampaign(id);

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Error duplicating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate campaign' },
      { status: 500 }
    );
  }
}
