import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/server/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: adAccountId } = await params;

    // Verify user has access to this ad account
    const adAccount = await prisma.adAccount.findFirst({
      where: {
        id: adAccountId,
        userId: userId,
      },
    });

    if (!adAccount) {
      return NextResponse.json({ error: 'Ad account not found' }, { status: 404 });
    }

    // Get active campaigns count
    const activeCampaigns = await prisma.campaign.count({
      where: {
        adAccountId: adAccountId,
        status: 'Active',
      },
    });

    // Get total budget from active campaigns
    const budgetStats = await prisma.campaign.aggregate({
      where: {
        adAccountId: adAccountId,
        status: 'Active',
      },
      _sum: {
        budget: true,
      },
    });

    // Get today's spend
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySpend = await prisma.campaign.aggregate({
      where: {
        adAccountId: adAccountId,
        createdAt: {
          gte: today,
        },
      },
      _sum: {
        spent: true,
      },
    });

    const statusData = {
      status: adAccount.status,
      lastSync: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      activeCampaigns,
      totalBudget: budgetStats._sum.budget || 0,
      spendToday: todaySpend._sum.spent || 0,
      currency: adAccount.currency,
    };

    return NextResponse.json(statusData);
  } catch (error) {
    console.error('Error fetching account status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account status' },
      { status: 500 }
    );
  }
}