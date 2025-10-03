import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create ad accounts
  const facebookAccount = await prisma.adAccount.upsert({
    where: { id: 'facebook-acc-1' },
    update: {},
    create: {
      id: 'facebook-acc-1',
      name: 'Facebook Ads Account',
      platform: 'facebook',
      status: 'active',
      currency: 'USD',
      timeZone: 'UTC',
    },
  });

  const instagramAccount = await prisma.adAccount.upsert({
    where: { id: 'instagram-acc-1' },
    update: {},
    create: {
      id: 'instagram-acc-1',
      name: 'Instagram Ads Account',
      platform: 'instagram',
      status: 'active',
      currency: 'USD',
      timeZone: 'UTC',
    },
  });

  console.log('✅ Ad accounts created');

  // Create campaigns for Facebook
  const campaign1 = await prisma.campaign.create({
    data: {
      adAccountId: facebookAccount.id,
      name: 'Summer Sale 2025',
      status: 'Eligible',
      budget: 5000,
      spent: 2350.50,
      impressions: 125000,
      clicks: 3500,
      ctr: 2.8,
      conversions: 450,
      costPerConversion: 5.22,
      dateStart: '2025-06-01',
      dateEnd: '2025-08-31',
      schedule: 'Daily 9am-9pm',
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      adAccountId: facebookAccount.id,
      name: 'Brand Awareness Campaign',
      status: 'Eligible',
      budget: 3000,
      spent: 1200.75,
      impressions: 85000,
      clicks: 2100,
      ctr: 2.47,
      conversions: 280,
      costPerConversion: 4.29,
      dateStart: '2025-05-15',
      dateEnd: '2025-07-15',
      schedule: 'All day',
    },
  });

  const campaign3 = await prisma.campaign.create({
    data: {
      adAccountId: instagramAccount.id,
      name: 'Product Launch - Instagram',
      status: 'Eligible',
      budget: 4000,
      spent: 3200.25,
      impressions: 150000,
      clicks: 4200,
      ctr: 2.8,
      conversions: 520,
      costPerConversion: 6.15,
      dateStart: '2025-07-01',
      dateEnd: '2025-09-30',
      schedule: 'Daily 10am-10pm',
    },
  });

  console.log('✅ Campaigns created');

  // Create ad groups for campaign1
  const adGroup1 = await prisma.adGroup.create({
    data: {
      campaignId: campaign1.id,
      name: 'Ad Group - 18-25 Female',
      status: 'Active',
      budget: 2000,
      spent: 950.25,
      impressions: 50000,
      clicks: 1400,
      ctr: 2.8,
      cpc: 0.68,
      conversions: 180,
      dateStart: '2025-06-01',
      dateEnd: '2025-08-31',
    },
  });

  const adGroup2 = await prisma.adGroup.create({
    data: {
      campaignId: campaign1.id,
      name: 'Ad Group - 25-35 Male',
      status: 'Active',
      budget: 1500,
      spent: 750.50,
      impressions: 40000,
      clicks: 1100,
      ctr: 2.75,
      cpc: 0.68,
      conversions: 140,
      dateStart: '2025-06-01',
      dateEnd: '2025-08-31',
    },
  });

  const adGroup3 = await prisma.adGroup.create({
    data: {
      campaignId: campaign2.id,
      name: 'Ad Group - General Audience',
      status: 'Active',
      budget: 1500,
      spent: 600.25,
      impressions: 42500,
      clicks: 1050,
      ctr: 2.47,
      cpc: 0.57,
      conversions: 140,
      dateStart: '2025-05-15',
      dateEnd: '2025-07-15',
    },
  });

  console.log('✅ Ad groups created');

  // Create creatives for ad groups
  await prisma.creative.createMany({
    data: [
      {
        adGroupId: adGroup1.id,
        name: 'Summer Sale Banner - Women',
        format: 'Image',
        status: 'Active',
        impressions: 25000,
        clicks: 700,
        ctr: 2.8,
        engagement: 1200,
        spend: 476.00,
        roas: 4.2,
        dateStart: '2025-06-01',
        dateEnd: '2025-08-31',
      },
      {
        adGroupId: adGroup1.id,
        name: 'Summer Sale Video - Women',
        format: 'Video',
        status: 'Active',
        impressions: 25000,
        clicks: 700,
        ctr: 2.8,
        engagement: 1500,
        spend: 474.25,
        roas: 4.5,
        dateStart: '2025-06-01',
        dateEnd: '2025-08-31',
      },
      {
        adGroupId: adGroup2.id,
        name: 'Summer Sale Banner - Men',
        format: 'Image',
        status: 'Active',
        impressions: 20000,
        clicks: 550,
        ctr: 2.75,
        engagement: 950,
        spend: 374.00,
        roas: 3.8,
        dateStart: '2025-06-01',
        dateEnd: '2025-08-31',
      },
      {
        adGroupId: adGroup2.id,
        name: 'Summer Sale Carousel - Men',
        format: 'Carousel',
        status: 'Active',
        impressions: 20000,
        clicks: 550,
        ctr: 2.75,
        engagement: 1100,
        spend: 376.50,
        roas: 4.0,
        dateStart: '2025-06-01',
        dateEnd: '2025-08-31',
      },
      {
        adGroupId: adGroup3.id,
        name: 'Brand Awareness Video',
        format: 'Video',
        status: 'Active',
        impressions: 42500,
        clicks: 1050,
        ctr: 2.47,
        engagement: 1800,
        spend: 600.25,
        roas: 3.5,
        dateStart: '2025-05-15',
        dateEnd: '2025-07-15',
      },
    ],
  });

  console.log('✅ Creatives created');
  console.log('🌱 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
