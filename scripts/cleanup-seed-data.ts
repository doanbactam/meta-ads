import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupSeedData() {
  console.log('🧹 Cleaning up seed data...');
  
  try {
    // Delete all campaigns (this will cascade to ad groups and creatives)
    const deletedCampaigns = await prisma.campaign.deleteMany({});
    console.log(`✅ Deleted ${deletedCampaigns.count} campaigns`);
    
    // Delete all ad groups
    const deletedAdGroups = await prisma.adGroup.deleteMany({});
    console.log(`✅ Deleted ${deletedAdGroups.count} ad groups`);
    
    // Delete all creatives
    const deletedCreatives = await prisma.creative.deleteMany({});
    console.log(`✅ Deleted ${deletedCreatives.count} creatives`);
    
    // Keep ad accounts but remove demo user's accounts
    const demoUser = await prisma.user.findFirst({
      where: { email: 'demo@example.com' }
    });
    
    if (demoUser) {
      const deletedDemoAccounts = await prisma.adAccount.deleteMany({
        where: { userId: demoUser.id }
      });
      console.log(`✅ Deleted ${deletedDemoAccounts.count} demo ad accounts`);
      
      // Delete demo user
      await prisma.user.delete({
        where: { id: demoUser.id }
      });
      console.log('✅ Deleted demo user');
    }
    
    // Check remaining data
    const remainingUsers = await prisma.user.count();
    const remainingAdAccounts = await prisma.adAccount.count();
    const remainingCampaigns = await prisma.campaign.count();
    
    console.log('\n📊 Remaining data:');
    console.log(`  - Users: ${remainingUsers}`);
    console.log(`  - Ad Accounts: ${remainingAdAccounts}`);
    console.log(`  - Campaigns: ${remainingCampaigns}`);
    
    console.log('\n🎉 Cleanup completed! Now only real Facebook data will be used.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupSeedData();