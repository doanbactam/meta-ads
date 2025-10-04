import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserSettings() {
  console.log('🔄 Updating existing users with default settings...');
  
  try {
    // Get all users first
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users to update`);
    
    // Update each user individually
    for (const user of users) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            preferredCurrency: 'USD',
            preferredLocale: 'en-US', 
            preferredTimezone: 'UTC',
          },
        });
        console.log(`✅ Updated user: ${user.email}`);
      } catch (updateError) {
        console.log(`⚠️ Skipped user ${user.email} (already has settings or error)`);
      }
    }
    
    // Check final state
    const updatedUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        preferredCurrency: true,
        preferredLocale: true,
        preferredTimezone: true,
      }
    });
    
    console.log('\n📊 Final user settings:');
    updatedUsers.forEach(user => {
      console.log(`  - ${user.email}: ${user.preferredCurrency} | ${user.preferredLocale} | ${user.preferredTimezone}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating user settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserSettings();