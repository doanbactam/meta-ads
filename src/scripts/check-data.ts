import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('=== CHECKING DATABASE DATA ===');
  
  // Check users
  const users = await prisma.user.findMany();
  console.log('\n📊 Users:', users.length);
  users.forEach(u => console.log('  -', u.clerkId, u.email, u.name));
  
  // Check ad accounts
  const adAccounts = await prisma.adAccount.findMany();
  console.log('\n📊 Ad Accounts:', adAccounts.length);
  adAccounts.forEach(a => console.log('  -', a.id, a.name, 'userId:', a.userId, 'platform:', a.platform));
  
  // Check campaigns
  const campaigns = await prisma.campaign.findMany();
  console.log('\n📊 Campaigns:', campaigns.length);
  campaigns.forEach(c => console.log('  -', c.id, c.name, 'adAccountId:', c.adAccountId));
  
  // Check relationship
  console.log('\n🔗 Checking relationships:');
  for (const account of adAccounts) {
    const accountCampaigns = await prisma.campaign.findMany({
      where: { adAccountId: account.id }
    });
    console.log(`  - Account "${account.name}" has ${accountCampaigns.length} campaigns`);
  }
  
  await prisma.$disconnect();
}

checkData().catch(console.error);