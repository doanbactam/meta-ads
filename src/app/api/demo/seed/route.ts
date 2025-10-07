import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST() {
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

    // Create test ad account
    const adAccount = await prisma.adAccount.create({
      data: {
        userId: currentUser.id,
        name: `Test Account ${Date.now()}`,
        currency: 'USD',
        timeZone: 'Asia/Ho_Chi_Minh',
        platform: 'FACEBOOK',
        status: 'ACTIVE',
        facebookAdAccountId: `act_test_${Date.now()}`,
      },
    });

    // Create test campaigns
    const campaigns = await Promise.all(
      Array.from({ length: 3 }, async (_, i) => {
        const budget = (1000 + i * 500) * 100; // Convert to cents
        const spent = Math.floor(Math.random() * 500 * 100); // Convert to cents
        const conversions = Math.floor(Math.random() * 50) + 1; // At least 1 conversion
        const costPerConversion = spent / conversions; // Calculate cost per conversion in cents
        
        return prisma.campaign.create({
          data: {
            adAccountId: adAccount.id,
            name: `Test Campaign ${i + 1}`,
            budget,
            spent,
            impressions: Math.floor(Math.random() * 10000),
            clicks: Math.floor(Math.random() * 500),
            ctr: Math.random() * 5,
            conversions,
            costPerConversion,
            status: 'ACTIVE',
            dateStart: new Date(),
            dateEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }),
    );

    // Create test ad groups
    const adGroups = await Promise.all(
      campaigns.flatMap((campaign) =>
        Array.from({ length: 2 }, async (_, i) => {
          const budget = (500 + i * 200) * 100; // Convert to cents
          const spent = Math.floor(Math.random() * 300 * 100); // Convert to cents
          const clicks = Math.floor(Math.random() * 250) + 1;
          const cpc = spent / clicks; // Calculate CPC in cents
          
          return prisma.adGroup.create({
            data: {
              campaignId: campaign.id,
              name: `Test Ad Group ${i + 1}`,
              budget,
              spent,
              impressions: Math.floor(Math.random() * 5000),
              clicks,
              ctr: Math.random() * 5,
              cpc,
              conversions: Math.floor(Math.random() * 25),
              status: 'ACTIVE',
              dateStart: new Date(),
              dateEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        }),
      ),
    );

    // Create test creatives
    await Promise.all(
      adGroups.flatMap((adGroup) =>
        Array.from({ length: 2 }, async (_, i) => {
          const spend = Math.floor(Math.random() * 150 * 100); // Convert to cents
          
          return prisma.creative.create({
            data: {
              adGroupId: adGroup.id,
              name: `Test Creative ${i + 1}`,
              format: i % 2 === 0 ? 'image' : 'video',
              impressions: Math.floor(Math.random() * 2500),
              clicks: Math.floor(Math.random() * 125),
              ctr: Math.random() * 5,
              engagement: Math.random() * 10,
              spend,
              roas: Math.random() * 5,
              status: 'ACTIVE',
              dateStart: new Date(),
              dateEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        }),
      ),
    );

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      data: {
        adAccount: 1,
        campaigns: campaigns.length,
        adGroups: adGroups.length,
        creatives: adGroups.length * 2,
      },
    });
  } catch (error) {
    console.error('Error creating test data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
