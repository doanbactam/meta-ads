-- Migration to create Platform enum type and fix existing data
-- This script is idempotent and safe to run multiple times

-- Step 1: Create the Platform enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "Platform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'MESSENGER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: If the platform column exists but is not using the enum type, we need to convert it
DO $$ 
BEGIN
    -- Check if the column exists and what type it is
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ad_accounts' 
        AND column_name = 'platform'
        AND data_type != 'USER-DEFINED'
    ) THEN
        -- First, update all lowercase values to uppercase
        UPDATE ad_accounts 
        SET platform = UPPER(platform)
        WHERE platform IS NOT NULL;
        
        -- Convert the column to use the enum type
        ALTER TABLE ad_accounts 
        ALTER COLUMN platform TYPE "Platform" 
        USING platform::"Platform";
        
        -- Set default if not already set
        ALTER TABLE ad_accounts 
        ALTER COLUMN platform SET DEFAULT 'FACEBOOK'::"Platform";
    END IF;
END $$;

-- Step 3: Ensure all existing platform values are uppercase (in case they weren't)
UPDATE ad_accounts 
SET platform = 'FACEBOOK'::"Platform"
WHERE platform::text = 'facebook' OR platform::text = 'FACEBOOK';

UPDATE ad_accounts 
SET platform = 'INSTAGRAM'::"Platform"
WHERE platform::text = 'instagram' OR platform::text = 'INSTAGRAM';

UPDATE ad_accounts 
SET platform = 'LINKEDIN'::"Platform"
WHERE platform::text = 'linkedin' OR platform::text = 'LINKEDIN';

UPDATE ad_accounts 
SET platform = 'MESSENGER'::"Platform"
WHERE platform::text = 'messenger' OR platform::text = 'MESSENGER';
