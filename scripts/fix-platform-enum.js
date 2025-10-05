#!/usr/bin/env node

/**
 * Script to fix platform enum values in the database
 * Converts lowercase 'facebook' to uppercase 'FACEBOOK' to match Prisma schema
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.error('Please set DATABASE_URL in your .env file');
  process.exit(1);
}

const sqlFile = path.join(__dirname, '../prisma/migrations/fix_platform_enum.sql');

if (!fs.existsSync(sqlFile)) {
  console.error(`❌ ERROR: SQL file not found at ${sqlFile}`);
  process.exit(1);
}

console.log('🔧 Fixing platform enum values in database...');
console.log('📄 Running SQL migration: fix_platform_enum.sql');

try {
  // Check if psql is available
  try {
    execSync('psql --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ ERROR: psql command not found');
    console.error('Please install PostgreSQL client tools');
    console.error('\nOn macOS: brew install postgresql');
    console.error('On Ubuntu: sudo apt-get install postgresql-client');
    console.error('On Windows: Install PostgreSQL from https://www.postgresql.org/download/windows/');
    process.exit(1);
  }

  // Read and execute SQL file
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  console.log('\nExecuting SQL commands:');
  console.log(sql.split('\n').filter(line => line.trim() && !line.startsWith('--')).join('\n'));
  
  execSync(`psql "${dbUrl}" -f "${sqlFile}"`, { 
    stdio: 'inherit',
    encoding: 'utf8'
  });

  console.log('\n✅ SUCCESS: Platform enum values fixed successfully!');
  console.log('✨ All platform values are now uppercase (FACEBOOK, INSTAGRAM, etc.)');
  
} catch (error) {
  console.error('\n❌ ERROR: Failed to fix platform enum values');
  console.error('Error details:', error.message);
  
  if (error.message.includes('connection')) {
    console.error('\n💡 TIP: Check your DATABASE_URL connection string');
    console.error('Make sure the database is running and accessible');
  }
  
  process.exit(1);
}
