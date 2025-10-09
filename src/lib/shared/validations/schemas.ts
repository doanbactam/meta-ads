import { z } from 'zod';

// Helper schemas for safe number parsing
const safeFloatSchema = z
  .union([z.string(), z.number()])
  .transform((val) => {
    if (val === null || val === undefined || val === '') return 0;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return Number.isNaN(num) || !Number.isFinite(num) ? 0 : num;
  })
  .pipe(z.number().finite());

const safeIntSchema = z
  .union([z.string(), z.number()])
  .transform((val) => {
    if (val === null || val === undefined || val === '') return 0;
    const num = typeof val === 'string' ? parseInt(val, 10) : Math.floor(val);
    return Number.isNaN(num) || !Number.isFinite(num) ? 0 : num;
  })
  .pipe(z.number().int().finite());

// Facebook API response validation schemas
export const facebookCampaignDataSchema = z.object({
  id: z.string().min(1, 'Campaign ID is required'),
  name: z.string().min(1).catch('Unnamed Campaign'),
  status: z.string().default('PAUSED'),
  objective: z.string().optional().nullable(),
  spendCap: z.string().optional().nullable(),
  dailyBudget: z.string().optional().nullable(),
  lifetimeBudget: z.string().optional().nullable(),
  createdTime: z.string().optional().nullable(),
  updatedTime: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  stopTime: z.string().optional().nullable(),
});

export const facebookCampaignInsightsSchema = z.object({
  impressions: z.string().optional().nullable(),
  clicks: z.string().optional().nullable(),
  spend: z.string().optional().nullable(),
  reach: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  ctr: z.string().optional().nullable(),
  cpc: z.string().optional().nullable(),
  cpm: z.string().optional().nullable(),
  conversions: z.string().optional().nullable(),
  costPerConversion: z.string().optional().nullable(),
  date_start: z.string().optional().nullable(),
  date_stop: z.string().optional().nullable(),
});

export const facebookAdSetDataSchema = z.object({
  id: z.string().min(1, 'Ad Set ID is required'),
  name: z.string().min(1).catch('Unnamed Ad Set'),
  status: z.string().default('PAUSED'),
  effective_status: z.string().optional().nullable(),
  daily_budget: z.string().optional().nullable(),
  lifetime_budget: z.string().optional().nullable(),
  bid_amount: z.string().optional().nullable(),
  targeting: z.any().optional().nullable(),
  created_time: z.string().optional().nullable(),
  updated_time: z.string().optional().nullable(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
});

export const facebookAdDataSchema = z.object({
  id: z.string().min(1, 'Ad ID is required'),
  name: z.string().min(1).catch('Unnamed Ad'),
  status: z.string().default('PAUSED'),
  effective_status: z.string().optional().nullable(),
  creative: z.any().optional().nullable(),
  created_time: z.string().optional().nullable(),
  updated_time: z.string().optional().nullable(),
});

export const facebookAdAccountDataSchema = z.object({
  id: z.string().min(1, 'Ad Account ID is required'),
  name: z.string().min(1).catch('Unnamed Account'),
  accountStatus: z.number().int().default(1),
  currency: z.string().min(1).default('USD'),
  timezone: z.string().min(1).default('UTC'),
  businessId: z.string().optional().nullable(),
  accessType: z.string().optional().nullable(),
});

// Safe data transformation schemas
export const sanitizedCampaignInsightsSchema = z.object({
  impressions: safeIntSchema.default(0),
  clicks: safeIntSchema.default(0),
  spend: safeFloatSchema.default(0),
  reach: safeIntSchema.default(0),
  frequency: safeFloatSchema.default(0),
  ctr: safeFloatSchema.default(0),
  cpc: safeFloatSchema.default(0),
  cpm: safeFloatSchema.default(0),
  conversions: safeIntSchema.default(0),
  costPerConversion: safeFloatSchema.default(0),
});

// Ad Account schemas
export const adAccountSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, 'Name is required'),
  platform: z.enum(['FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'MESSENGER']),
  status: z.enum(['ACTIVE', 'PAUSED', 'DISABLED']),
  currency: z.string().default('USD'),
  timeZone: z.string().default('UTC'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createAdAccountSchema = adAccountSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAdAccountSchema = adAccountSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

// Campaign schemas
export const campaignSchema = z.object({
  id: z.string().cuid(),
  adAccountId: z.string().cuid(),
  name: z.string().min(1, 'Campaign name is required'),
  status: z.enum(['Eligible', 'Paused', 'Disapproved', 'Pending', 'Ended', 'Removed']),
  budget: z.number().positive('Budget must be positive'),
  spent: z.number().nonnegative().default(0),
  impressions: z.number().int().nonnegative().default(0),
  clicks: z.number().int().nonnegative().default(0),
  ctr: z.number().nonnegative().default(0),
  conversions: z.number().int().nonnegative().default(0),
  costPerConversion: z.number().nonnegative().default(0),
  dateStart: z.string(),
  dateEnd: z.string(),
  schedule: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createCampaignSchema = campaignSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCampaignSchema = campaignSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

// Ad Group schemas
export const adGroupSchema = z.object({
  id: z.string().cuid(),
  campaignId: z.string().cuid(),
  name: z.string().min(1, 'Ad group name is required'),
  status: z.enum(['Active', 'Paused', 'Pending', 'Ended']),
  budget: z.number().positive('Budget must be positive'),
  spent: z.number().nonnegative().default(0),
  impressions: z.number().int().nonnegative().default(0),
  clicks: z.number().int().nonnegative().default(0),
  ctr: z.number().nonnegative().default(0),
  cpc: z.number().nonnegative().default(0),
  conversions: z.number().int().nonnegative().default(0),
  dateStart: z.string(),
  dateEnd: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createAdGroupSchema = adGroupSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAdGroupSchema = adGroupSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

// Creative schemas
export const creativeSchema = z.object({
  id: z.string().cuid(),
  adGroupId: z.string().cuid(),
  name: z.string().min(1, 'Creative name is required'),
  format: z.enum(['Image', 'Video', 'Carousel', 'Story']),
  status: z.enum(['Active', 'Paused', 'Review', 'Rejected']),
  impressions: z.number().int().nonnegative().default(0),
  clicks: z.number().int().nonnegative().default(0),
  ctr: z.number().nonnegative().default(0),
  engagement: z.number().nonnegative().default(0),
  spend: z.number().nonnegative().default(0),
  roas: z.number().nonnegative().default(0),
  dateStart: z.string(),
  dateEnd: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createCreativeSchema = creativeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCreativeSchema = creativeSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

// Type exports
export type AdAccount = z.infer<typeof adAccountSchema>;
export type CreateAdAccount = z.infer<typeof createAdAccountSchema>;
export type UpdateAdAccount = z.infer<typeof updateAdAccountSchema>;

export type Campaign = z.infer<typeof campaignSchema>;
export type CreateCampaign = z.infer<typeof createCampaignSchema>;
export type UpdateCampaign = z.infer<typeof updateCampaignSchema>;

export type AdGroup = z.infer<typeof adGroupSchema>;
export type CreateAdGroup = z.infer<typeof createAdGroupSchema>;
export type UpdateAdGroup = z.infer<typeof updateAdGroupSchema>;

export type Creative = z.infer<typeof creativeSchema>;
export type CreateCreative = z.infer<typeof createCreativeSchema>;
export type UpdateCreative = z.infer<typeof updateCreativeSchema>;
