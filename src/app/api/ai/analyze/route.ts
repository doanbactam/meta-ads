import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeCampaign } from '@/lib/ai/analyzer';
import { prisma } from '@/lib/server/prisma';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';

const analyzeSchema = z.object({
  campaignId: z.string(),
});

/**
 * POST /api/ai/analyze
 * Analyze a campaign using AI
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    const body = await request.json();
    const { campaignId } = analyzeSchema.parse(body);

    // Get user
    const user = await getOrCreateUserFromClerk(clerkId);

    // Fetch campaign with ad account (ensure user owns it)
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        adAccount: {
          userId: user.id,
        },
      },
      include: {
        adAccount: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or access denied' },
        { status: 404 }
      );
    }

    // Transform Prisma model to Campaign type
    const campaignData = {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status as 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED' | 'PENDING' | 'ENDED' | 'DISAPPROVED' | 'REMOVED',
      budget: campaign.budget,
      spent: campaign.spent,
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      ctr: campaign.ctr,
      conversions: campaign.conversions,
      cost_per_conversion: campaign.costPerConversion,
      date_start: campaign.dateStart.toISOString().split('T')[0],
      date_end: campaign.dateEnd.toISOString().split('T')[0],
      schedule: campaign.schedule,
      created_at: campaign.createdAt.toISOString(),
      updated_at: campaign.updatedAt.toISOString(),
    };

    // Analyze with AI
    const analysis = await analyzeCampaign(campaignData);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('AI analysis error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json(
      { error: 'Analysis failed', message: errorMessage },
      { status: 500 }
    );
  }
}
