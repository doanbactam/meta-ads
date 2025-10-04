import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createRealCampaigns() {
  console.log('🚀 Creating campaigns for real user...');
  
  // Get real user's ad accounts
  const realUser = await prisma.user.findFirst({
    where: { email: 'iamsyr.vn@gmail.com' }
  });
  
  if (!realUser) {
    console.log('❌ Real user not found');
    return;
  }
  
  const adAccounts = await prisma.adAccount.findMany({
    where: { userId: realUser.id }
  });
  
  console.log(`📊 Found ${adAccounts.length} ad accounts for real user`);
  
  // Create campaigns for each ad account
  for (const account of adAccounts) {
    console.log(`\n📝 Creating campaigns for "${account.name}" (${account.platform})`);
    
    if (account.platform === 'facebook') {
      // Create Facebook campaigns
      await prisma.campaign.create({
        data: {
          adAccountId: account.id,
          name: `${account.name} - Holiday Campaign 2025`,
          status: 'Eligible',
          budget: 8000,
          spent: 3250.75,
          impressions: 180000,
          clicks: 5200,
          ctr: 2.89,
          conversions: 650,
          costPerConversion: 5.00,
          dateStart: '2025-01-01',
          dateEnd: '2025-03-31',
          schedule: 'Daily 8am-10pm',
        },
      });
      
      await prisma.campaign.create({
        data: {
          adAccountId: account.id,
          name: `${account.name} - Retargeting Campaign`,
          status: 'Eligible',
          budget: 5000,
          spent: 2100.50,
          impressions: 95000,
          clicks: 2850,
          ctr: 3.0,
          conversions: 380,
          costPerConversion: 5.53,
          dateStart: '2025-01-15',
          dateEnd: '2025-04-15',
          schedule: 'All day',
        },
      });
      
      await prisma.campaign.create({
        data: {
          adAccountId: account.id,
          name: `${account.name} - Brand Awareness`,
          status: 'Paused',
          budget: 3000,
          spent: 850.25,
          impressions: 45000,
          clicks: 1200,
          ctr: 2.67,
          conversions: 150,
          costPerConversion: 5.67,
          dateStart: '2024-12-01',
          dateEnd: '2025-02-28',
          schedule: 'Weekdays 9am-6pm',
        },
      });
    }
  }
  
  console.log('\n✅ Campaigns created successfully!');
  
  // Verify
  const totalCampaigns = await prisma.campaign.count({
    where: {
      adAccount: {
        userId: realUser.id
      }
    }
  });
  
  console.log(`📊 Total campaigns for real user: ${totalCampaigns}`);
  
  await prisma.$disconnect();
}

createRealCampaigns().catch(console.error);