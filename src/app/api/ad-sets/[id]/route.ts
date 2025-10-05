import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { deleteAdGroup } from '@/lib/server/api/ad-groups';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await deleteAdGroup(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ad set:', error);
    return NextResponse.json(
      { error: 'Failed to delete ad set' },
      { status: 500 }
    );
  }
}
