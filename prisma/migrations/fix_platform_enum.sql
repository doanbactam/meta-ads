-- Migration to fix platform enum values
-- Converts lowercase 'facebook' to uppercase 'FACEBOOK' to match Prisma schema

UPDATE ad_accounts 
SET platform = 'FACEBOOK' 
WHERE LOWER(platform) = 'facebook';

UPDATE ad_accounts 
SET platform = 'INSTAGRAM' 
WHERE LOWER(platform) = 'instagram';

UPDATE ad_accounts 
SET platform = 'LINKEDIN' 
WHERE LOWER(platform) = 'linkedin';

UPDATE ad_accounts 
SET platform = 'MESSENGER' 
WHERE LOWER(platform) = 'messenger';
