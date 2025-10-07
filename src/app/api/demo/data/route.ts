import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [users, adAccounts, campaigns, adGroups, creatives] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adAccount.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          adAccount: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.adGroup.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          campaign: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.creative.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          adGroup: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      users,
      adAccounts,
      campaigns,
      adGroups,
      creatives,
    });
  } catch (error) {
    console.error('Error fetching demo data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
