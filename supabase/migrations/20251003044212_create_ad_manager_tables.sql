/*
  # Create Ad Manager Database Schema

  ## Overview
  This migration creates the complete database structure for the Ad Manager application,
  including tables for campaigns, ad groups, and creatives with their relationships.

  ## New Tables
  
  ### 1. campaigns
  - `id` (uuid, primary key) - Unique campaign identifier
  - `name` (text) - Campaign name
  - `status` (text) - Campaign status (Eligible, Paused, Disapproved, Pending, Ended, Removed)
  - `budget` (numeric) - Total campaign budget
  - `spent` (numeric) - Amount spent
  - `impressions` (integer) - Number of impressions
  - `clicks` (integer) - Number of clicks
  - `ctr` (numeric) - Click-through rate
  - `conversions` (integer) - Number of conversions
  - `cost_per_conversion` (numeric) - Cost per conversion
  - `date_start` (date) - Campaign start date
  - `date_end` (date) - Campaign end date
  - `schedule` (text) - Schedule type
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 2. ad_groups
  - `id` (uuid, primary key) - Unique ad group identifier
  - `campaign_id` (uuid, foreign key) - Reference to parent campaign
  - `name` (text) - Ad group name
  - `status` (text) - Ad group status (Active, Paused, Pending, Ended)
  - `budget` (numeric) - Ad group budget
  - `spent` (numeric) - Amount spent
  - `impressions` (integer) - Number of impressions
  - `clicks` (integer) - Number of clicks
  - `ctr` (numeric) - Click-through rate
  - `cpc` (numeric) - Cost per click
  - `conversions` (integer) - Number of conversions
  - `date_start` (date) - Ad group start date
  - `date_end` (date) - Ad group end date
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 3. creatives
  - `id` (uuid, primary key) - Unique creative identifier
  - `ad_group_id` (uuid, foreign key) - Reference to parent ad group
  - `name` (text) - Creative name
  - `format` (text) - Creative format (Image, Video, Carousel, Story)
  - `status` (text) - Creative status (Active, Paused, Review, Rejected)
  - `impressions` (integer) - Number of impressions
  - `clicks` (integer) - Number of clicks
  - `ctr` (numeric) - Click-through rate
  - `engagement` (numeric) - Engagement rate
  - `spend` (numeric) - Amount spent
  - `roas` (numeric) - Return on ad spend
  - `date_start` (date) - Creative start date
  - `date_end` (date) - Creative end date
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ## Security
  
  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Public access policies are created for demonstration purposes
  - In production, these should be replaced with proper authentication-based policies

  ## Indexes
  - Foreign key indexes for optimal query performance
  - Status indexes for filtering operations
  - Date range indexes for time-based queries

  ## Notes
  - All monetary values use numeric type for precision
  - All tables include automatic timestamp tracking
  - Foreign key constraints maintain referential integrity
  - Cascading deletes ensure clean data removal
*/

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  budget numeric NOT NULL DEFAULT 0,
  spent numeric NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  cost_per_conversion numeric NOT NULL DEFAULT 0,
  date_start date NOT NULL,
  date_end date NOT NULL,
  schedule text NOT NULL DEFAULT 'Advanced Schedule',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ad_groups table
CREATE TABLE IF NOT EXISTS ad_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  budget numeric NOT NULL DEFAULT 0,
  spent numeric NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  cpc numeric NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  date_start date NOT NULL,
  date_end date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create creatives table
CREATE TABLE IF NOT EXISTS creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_group_id uuid NOT NULL REFERENCES ad_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  format text NOT NULL DEFAULT 'Image',
  status text NOT NULL DEFAULT 'Review',
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  engagement numeric NOT NULL DEFAULT 0,
  spend numeric NOT NULL DEFAULT 0,
  roas numeric NOT NULL DEFAULT 0,
  date_start date NOT NULL,
  date_end date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ad_groups_campaign_id ON ad_groups(campaign_id);
CREATE INDEX IF NOT EXISTS idx_creatives_ad_group_id ON creatives(ad_group_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_groups_status ON ad_groups(status);
CREATE INDEX IF NOT EXISTS idx_creatives_status ON creatives(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_date_range ON campaigns(date_start, date_end);

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE creatives ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
-- In production, replace these with proper authentication-based policies
CREATE POLICY "Enable read access for all users" ON campaigns
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users" ON campaigns
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON campaigns
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON campaigns
  FOR DELETE
  USING (true);

CREATE POLICY "Enable read access for all users" ON ad_groups
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users" ON ad_groups
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON ad_groups
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON ad_groups
  FOR DELETE
  USING (true);

CREATE POLICY "Enable read access for all users" ON creatives
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users" ON creatives
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON creatives
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON creatives
  FOR DELETE
  USING (true);

-- Insert sample data for campaigns
INSERT INTO campaigns (name, status, budget, spent, impressions, clicks, ctr, conversions, cost_per_conversion, date_start, date_end)
VALUES 
  ('Bluetooth Devices', 'Eligible', 50000, 46680, 234560, 6789, 2.89, 456, 6.88, '2022-03-01', '2022-06-02'),
  ('Airdot', 'Paused', 40000, 30000, 189340, 4234, 2.24, 298, 7.09, '2022-03-02', '2022-05-01'),
  ('Shoes', 'Disapproved', 35000, 15000, 98720, 2456, 2.49, 167, 6.11, '2021-12-30', '2022-01-06'),
  ('Kids T-Shirt', 'Pending', 28000, 12000, 67890, 1678, 2.47, 123, 7.15, '2022-05-23', '2022-06-06'),
  ('Smart Watch', 'Ended', 45000, 44200, 312450, 8234, 2.63, 678, 6.52, '2022-03-01', '2022-06-02'),
  ('Girls Top', 'Removed', 32000, 12000, 78560, 1897, 2.41, 145, 6.33, '2022-03-01', '2022-06-02')
ON CONFLICT (id) DO NOTHING;

-- Get campaign IDs for ad groups
DO $$
DECLARE
  bluetooth_id uuid;
  airdot_id uuid;
  shoes_id uuid;
  kids_id uuid;
  watch_id uuid;
  girls_id uuid;
BEGIN
  SELECT id INTO bluetooth_id FROM campaigns WHERE name = 'Bluetooth Devices' LIMIT 1;
  SELECT id INTO airdot_id FROM campaigns WHERE name = 'Airdot' LIMIT 1;
  SELECT id INTO shoes_id FROM campaigns WHERE name = 'Shoes' LIMIT 1;
  SELECT id INTO kids_id FROM campaigns WHERE name = 'Kids T-Shirt' LIMIT 1;
  SELECT id INTO watch_id FROM campaigns WHERE name = 'Smart Watch' LIMIT 1;
  SELECT id INTO girls_id FROM campaigns WHERE name = 'Girls Top' LIMIT 1;

  -- Insert sample data for ad_groups
  INSERT INTO ad_groups (campaign_id, name, status, budget, spent, impressions, clicks, ctr, cpc, conversions, date_start, date_end)
  VALUES 
    (bluetooth_id, 'Tech Enthusiasts', 'Active', 5000, 3246, 124580, 3456, 2.77, 0.94, 234, '2022-03-01', '2022-06-02'),
    (airdot_id, 'Young Professionals', 'Paused', 3500, 2100, 89340, 2145, 2.40, 0.98, 156, '2022-03-02', '2022-05-01'),
    (shoes_id, 'Sports & Fitness', 'Active', 4200, 3890, 156720, 4890, 3.12, 0.80, 389, '2021-12-30', '2022-01-06'),
    (kids_id, 'Parents 25-40', 'Pending', 2800, 450, 23450, 567, 2.42, 0.79, 45, '2022-05-23', '2022-06-06'),
    (watch_id, 'Tech Savvy Adults', 'Ended', 6000, 5980, 234560, 6789, 2.89, 0.88, 567, '2022-03-01', '2022-06-02'),
    (girls_id, 'Fashion Forward', 'Active', 3200, 2456, 98760, 3234, 3.27, 0.76, 289, '2022-03-01', '2022-06-02')
  ON CONFLICT DO NOTHING;
END $$;

-- Insert sample data for creatives
DO $$
DECLARE
  tech_id uuid;
  young_id uuid;
  sports_id uuid;
  parents_id uuid;
  techsavvy_id uuid;
  fashion_id uuid;
BEGIN
  SELECT id INTO tech_id FROM ad_groups WHERE name = 'Tech Enthusiasts' LIMIT 1;
  SELECT id INTO young_id FROM ad_groups WHERE name = 'Young Professionals' LIMIT 1;
  SELECT id INTO sports_id FROM ad_groups WHERE name = 'Sports & Fitness' LIMIT 1;
  SELECT id INTO parents_id FROM ad_groups WHERE name = 'Parents 25-40' LIMIT 1;
  SELECT id INTO techsavvy_id FROM ad_groups WHERE name = 'Tech Savvy Adults' LIMIT 1;
  SELECT id INTO fashion_id FROM ad_groups WHERE name = 'Fashion Forward' LIMIT 1;

  INSERT INTO creatives (ad_group_id, name, format, status, impressions, clicks, ctr, engagement, spend, roas, date_start, date_end)
  VALUES 
    (tech_id, 'Summer Sale Banner', 'Image', 'Active', 89450, 2567, 2.87, 4.2, 1234, 3.8, '2022-03-01', '2022-06-02'),
    (young_id, 'Product Demo Video', 'Video', 'Active', 124890, 4123, 3.30, 6.8, 2456, 4.5, '2022-03-02', '2022-05-01'),
    (sports_id, 'Feature Showcase', 'Carousel', 'Paused', 67230, 1890, 2.81, 3.9, 987, 2.9, '2021-12-30', '2022-01-06'),
    (parents_id, 'Flash Sale Story', 'Story', 'Review', 45120, 1234, 2.73, 5.1, 567, 3.2, '2022-05-23', '2022-06-06'),
    (techsavvy_id, 'Holiday Collection', 'Image', 'Active', 156780, 5234, 3.34, 4.7, 3123, 5.1, '2022-03-01', '2022-06-02'),
    (fashion_id, 'Brand Story Video', 'Video', 'Rejected', 23450, 456, 1.94, 2.3, 234, 1.2, '2022-03-01', '2022-06-02')
  ON CONFLICT DO NOTHING;
END $$;
