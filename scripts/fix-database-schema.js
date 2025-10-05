#!/usr/bin/env node

/**
 * Comprehensive database schema fix script
 * - Creates the Platform enum type if missing
 * - Converts platform column to use the enum
 * - Fixes any lowercase platform values
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Try to load .env file if it exists
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.error('\n💡 Please either:');
  console.error('   1. Set DATABASE_URL in your .env file');
  console.error('   2. Export it: export DATABASE_URL="postgresql://..."');
  console.error('   3. Pass it inline: DATABASE_URL="postgresql://..." node scripts/fix-database-schema.js');
  process.exit(1);
}

const sqlFile = path.join(__dirname, '../prisma/migrations/create_platform_enum.sql');

if (!fs.existsSync(sqlFile)) {
  console.error(`❌ ERROR: SQL file not found at ${sqlFile}`);
  process.exit(1);
}

console.log('🔧 Fixing database schema...');
console.log('📄 Running SQL migration: create_platform_enum.sql\n');

try {
  // Check if psql is available
  try {
    execSync('psql --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ ERROR: psql command not found');
    console.error('Please install PostgreSQL client tools\n');
    console.error('On macOS: brew install postgresql');
    console.error('On Ubuntu: sudo apt-get install postgresql-client');
    console.error('On Windows: Install PostgreSQL from https://www.postgresql.org/download/windows/');
    process.exit(1);
  }

  // Read SQL file
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  console.log('Executing SQL commands...\n');
  
  // Execute SQL file
  execSync(`psql "${dbUrl}" -f "${sqlFile}"`, { 
    stdio: 'inherit',
    encoding: 'utf8'
  });

  console.log('\n✅ SUCCESS: Database schema fixed successfully!');
  console.log('✨ Platform enum type created and all values normalized');
  console.log('\n📝 Next steps:');
  console.log('   1. Regenerate Prisma client: npm run prisma:generate');
  console.log('   2. Restart your development server');
  
} catch (error) {
  console.error('\n❌ ERROR: Failed to fix database schema');
  console.error('Error details:', error.message);
  
  if (error.message.includes('connection')) {
    console.error('\n💡 TIP: Check your DATABASE_URL connection string');
    console.error('Make sure the database is running and accessible');
  }
  
  console.error('\n🔍 Manual fix option:');
  console.error(`   Run this SQL directly in your database:`);
  console.error(`   psql "${dbUrl}" -f "${sqlFile}"`);
  
  process.exit(1);
}
