import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { clerkId: 'demo-user-clerk-id' },
    update: {},
    create: {
      clerkId: 'demo-user-clerk-id',
      email: 'demo@example.com',
      name: 'Demo User',
    },
  });

  console.log('✅ Demo user created');

  // Create ad accounts
  const facebookAccount = await prisma.adAccount.upsert({
    where: { id: 'facebook-acc-1' },
    update: {},
    create: {
      id: 'facebook-acc-1',
      userId: demoUser.id,
      name: 'Facebook Ads Account',
      platform: 'FACEBOOK',
      status: 'ACTIVE',
      currency: 'USD',
      timeZone: 'UTC',
    },
  });

  const instagramAccount = await prisma.adAccount.upsert({
    where: { id: 'instagram-acc-1' },
    update: {},
    create: {
      id: 'instagram-acc-1',
      userId: demoUser.id,
      name: 'Instagram Ads Account',
      platform: 'INSTAGRAM',
      status: 'ACTIVE',
      currency: 'USD',
      timeZone: 'UTC',
    },
  });

  const linkedinAccount = await prisma.adAccount.upsert({
    where: { id: 'linkedin-acc-1' },
    update: {},
    create: {
      id: 'linkedin-acc-1',
      userId: demoUser.id,
      name: 'LinkedIn Ads Account',
      platform: 'LINKEDIN',
      status: 'ACTIVE',
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
      status: 'ACTIVE',
      budget: 5000,
      spent: 2350.5,
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
      status: 'ACTIVE',
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
      status: 'ACTIVE',
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

  const campaign4 = await prisma.campaign.create({
    data: {
      adAccountId: linkedinAccount.id,
      name: 'B2B Lead Generation',
      status: 'ACTIVE',
      budget: 6000,
      spent: 4500.75,
      impressions: 95000,
      clicks: 2850,
      ctr: 3.0,
      conversions: 380,
      costPerConversion: 11.84,
      dateStart: '2025-06-15',
      dateEnd: '2025-09-15',
      schedule: 'Weekdays 8am-6pm',
    },
  });

  console.log('✅ Campaigns created');

  // Create ad groups for campaign1
  const adGroup1 = await prisma.adGroup.create({
    data: {
      campaignId: campaign1.id,
      name: 'Ad Group - 18-25 Female',
      status: 'ACTIVE',
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
      status: 'ACTIVE',
      budget: 1500,
      spent: 750.5,
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
      status: 'ACTIVE',
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

  const adGroup4 = await prisma.adGroup.create({
    data: {
      campaignId: campaign4.id,
      name: 'Ad Group - Decision Makers',
      status: 'ACTIVE',
      budget: 3000,
      spent: 2250.5,
      impressions: 47500,
      clicks: 1425,
      ctr: 3.0,
      cpc: 1.58,
      conversions: 190,
      dateStart: '2025-06-15',
      dateEnd: '2025-09-15',
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
        status: 'ACTIVE',
        impressions: 25000,
        clicks: 700,
        ctr: 2.8,
        engagement: 1200,
        spend: 476.0,
        roas: 4.2,
        dateStart: '2025-06-01',
        dateEnd: '2025-08-31',
      },
      {
        adGroupId: adGroup1.id,
        name: 'Summer Sale Video - Women',
        format: 'Video',
        status: 'ACTIVE',
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
        status: 'ACTIVE',
        impressions: 20000,
        clicks: 550,
        ctr: 2.75,
        engagement: 950,
        spend: 374.0,
        roas: 3.8,
        dateStart: '2025-06-01',
        dateEnd: '2025-08-31',
      },
      {
        adGroupId: adGroup2.id,
        name: 'Summer Sale Carousel - Men',
        format: 'Carousel',
        status: 'ACTIVE',
        impressions: 20000,
        clicks: 550,
        ctr: 2.75,
        engagement: 1100,
        spend: 376.5,
        roas: 4.0,
        dateStart: '2025-06-01',
        dateEnd: '2025-08-31',
      },
      {
        adGroupId: adGroup3.id,
        name: 'Brand Awareness Video',
        format: 'Video',
        status: 'ACTIVE',
        impressions: 42500,
        clicks: 1050,
        ctr: 2.47,
        engagement: 1800,
        spend: 600.25,
        roas: 3.5,
        dateStart: '2025-05-15',
        dateEnd: '2025-07-15',
      },
      {
        adGroupId: adGroup4.id,
        name: 'LinkedIn Sponsored Content',
        format: 'Image',
        status: 'ACTIVE',
        impressions: 47500,
        clicks: 1425,
        ctr: 3.0,
        engagement: 2100,
        spend: 2250.5,
        roas: 5.2,
        dateStart: '2025-06-15',
        dateEnd: '2025-09-15',
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
