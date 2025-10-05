import { z } from 'zod';

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
