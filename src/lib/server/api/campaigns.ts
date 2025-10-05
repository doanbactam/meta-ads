import { prisma } from '@/lib/server/prisma';
import { Campaign } from '@/types';

const EMPTY_CAMPAIGN_STATS = {
  spent: 0,
  impressions: 0,
  clicks: 0,
  ctr: 0,
  conversions: 0,
  costPerConversion: 0,
} as const;

export async function getCampaigns(adAccountId?: string): Promise<Campaign[]> {
  // This function is now deprecated as we fetch directly from Facebook API
  // Keeping it for backward compatibility but returning empty array
  console.warn('getCampaigns function is deprecated. Use Facebook API directly.');
  return [];
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
  });

  if (!campaign) return null;

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status as Campaign['status'],
    budget: campaign.budget,
    spent: campaign.spent,
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    ctr: campaign.ctr,
    conversions: campaign.conversions,
    cost_per_conversion: campaign.costPerConversion,
    date_start: campaign.dateStart,
    date_end: campaign.dateEnd,
    schedule: campaign.schedule,
    created_at: campaign.createdAt.toISOString(),
    updated_at: campaign.updatedAt.toISOString(),
  };
}

export async function createCampaign(
  data: Omit<Campaign, 'id' | 'created_at' | 'updated_at'> & { adAccountId: string }
): Promise<Campaign> {
  const campaign = await prisma.campaign.create({
    data: {
      adAccountId: data.adAccountId,
      name: data.name,
      status: data.status,
      budget: data.budget,
      spent: data.spent || 0,
      impressions: data.impressions || 0,
      clicks: data.clicks || 0,
      ctr: data.ctr || 0,
      conversions: data.conversions || 0,
      costPerConversion: data.cost_per_conversion || 0,
      dateStart: data.date_start,
      dateEnd: data.date_end,
      schedule: data.schedule,
    },
  });

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status as Campaign['status'],
    budget: campaign.budget,
    spent: campaign.spent,
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    ctr: campaign.ctr,
    conversions: campaign.conversions,
    cost_per_conversion: campaign.costPerConversion,
    date_start: campaign.dateStart,
    date_end: campaign.dateEnd,
    schedule: campaign.schedule,
    created_at: campaign.createdAt.toISOString(),
    updated_at: campaign.updatedAt.toISOString(),
  };
}

export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
  const campaign = await prisma.campaign.update({
    where: { id },
    data: {
      ...(updates.name && { name: updates.name }),
      ...(updates.status && { status: updates.status }),
      ...(updates.budget !== undefined && { budget: updates.budget }),
      ...(updates.spent !== undefined && { spent: updates.spent }),
      ...(updates.impressions !== undefined && { impressions: updates.impressions }),
      ...(updates.clicks !== undefined && { clicks: updates.clicks }),
      ...(updates.ctr !== undefined && { ctr: updates.ctr }),
      ...(updates.conversions !== undefined && { conversions: updates.conversions }),
      ...(updates.cost_per_conversion !== undefined && { costPerConversion: updates.cost_per_conversion }),
      ...(updates.date_start && { dateStart: updates.date_start }),
      ...(updates.date_end && { dateEnd: updates.date_end }),
      ...(updates.schedule && { schedule: updates.schedule }),
    },
  });

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status as Campaign['status'],
    budget: campaign.budget,
    spent: campaign.spent,
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    ctr: campaign.ctr,
    conversions: campaign.conversions,
    cost_per_conversion: campaign.costPerConversion,
    date_start: campaign.dateStart,
    date_end: campaign.dateEnd,
    schedule: campaign.schedule,
    created_at: campaign.createdAt.toISOString(),
    updated_at: campaign.updatedAt.toISOString(),
  };
}

export async function deleteCampaign(id: string): Promise<void> {
  await prisma.campaign.delete({
    where: { id },
  });
}

export async function duplicateCampaign(id: string): Promise<Campaign> {
  const original = await prisma.campaign.findUnique({
    where: { id },
  });

  if (!original) throw new Error('Campaign not found');

  const duplicate = await prisma.campaign.create({
    data: {
      adAccountId: original.adAccountId,
      name: `${original.name} (Copy)`,
      status: original.status,
      budget: original.budget,
      ...EMPTY_CAMPAIGN_STATS,
      dateStart: original.dateStart,
      dateEnd: original.dateEnd,
      schedule: original.schedule,
    },
  });

  return {
    id: duplicate.id,
    name: duplicate.name,
    status: duplicate.status as Campaign['status'],
    budget: duplicate.budget,
    spent: duplicate.spent,
    impressions: duplicate.impressions,
    clicks: duplicate.clicks,
    ctr: duplicate.ctr,
    conversions: duplicate.conversions,
    cost_per_conversion: duplicate.costPerConversion,
    date_start: duplicate.dateStart,
    date_end: duplicate.dateEnd,
    schedule: duplicate.schedule,
    created_at: duplicate.createdAt.toISOString(),
    updated_at: duplicate.updatedAt.toISOString(),
  };
}
