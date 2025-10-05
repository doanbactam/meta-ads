import { prisma } from '@/lib/server/prisma';
import type { AdGroup } from '@/types';

const EMPTY_AD_GROUP_STATS = {
  spent: 0,
  impressions: 0,
  clicks: 0,
  ctr: 0,
  cpc: 0,
  conversions: 0,
} as const;

export async function getAdGroups(campaignId?: string): Promise<AdGroup[]> {
  const adGroups = await prisma.adGroup.findMany({
    where: campaignId ? { campaignId } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  return adGroups.map((ag) => ({
    id: ag.id,
    campaign_id: ag.campaignId,
    name: ag.name,
    status: ag.status as AdGroup['status'],
    budget: ag.budget,
    spent: ag.spent,
    impressions: ag.impressions,
    clicks: ag.clicks,
    ctr: ag.ctr,
    cpc: ag.cpc,
    conversions: ag.conversions,
    date_start: ag.dateStart,
    date_end: ag.dateEnd,
    created_at: ag.createdAt.toISOString(),
    updated_at: ag.updatedAt.toISOString(),
  }));
}

export async function getAdGroupById(id: string): Promise<AdGroup | null> {
  const adGroup = await prisma.adGroup.findUnique({
    where: { id },
  });

  if (!adGroup) return null;

  return {
    id: adGroup.id,
    campaign_id: adGroup.campaignId,
    name: adGroup.name,
    status: adGroup.status as AdGroup['status'],
    budget: adGroup.budget,
    spent: adGroup.spent,
    impressions: adGroup.impressions,
    clicks: adGroup.clicks,
    ctr: adGroup.ctr,
    cpc: adGroup.cpc,
    conversions: adGroup.conversions,
    date_start: adGroup.dateStart,
    date_end: adGroup.dateEnd,
    created_at: adGroup.createdAt.toISOString(),
    updated_at: adGroup.updatedAt.toISOString(),
  };
}

export async function createAdGroup(
  data: Omit<AdGroup, 'id' | 'created_at' | 'updated_at'>
): Promise<AdGroup> {
  const adGroup = await prisma.adGroup.create({
    data: {
      campaignId: data.campaign_id,
      name: data.name,
      status: data.status,
      budget: data.budget,
      spent: data.spent || 0,
      impressions: data.impressions || 0,
      clicks: data.clicks || 0,
      ctr: data.ctr || 0,
      cpc: data.cpc || 0,
      conversions: data.conversions || 0,
      dateStart: data.date_start,
      dateEnd: data.date_end,
    },
  });

  return {
    id: adGroup.id,
    campaign_id: adGroup.campaignId,
    name: adGroup.name,
    status: adGroup.status as AdGroup['status'],
    budget: adGroup.budget,
    spent: adGroup.spent,
    impressions: adGroup.impressions,
    clicks: adGroup.clicks,
    ctr: adGroup.ctr,
    cpc: adGroup.cpc,
    conversions: adGroup.conversions,
    date_start: adGroup.dateStart,
    date_end: adGroup.dateEnd,
    created_at: adGroup.createdAt.toISOString(),
    updated_at: adGroup.updatedAt.toISOString(),
  };
}

export async function updateAdGroup(id: string, updates: Partial<AdGroup>): Promise<AdGroup> {
  const adGroup = await prisma.adGroup.update({
    where: { id },
    data: {
      ...(updates.name && { name: updates.name }),
      ...(updates.status && { status: updates.status }),
      ...(updates.budget !== undefined && { budget: updates.budget }),
      ...(updates.spent !== undefined && { spent: updates.spent }),
      ...(updates.impressions !== undefined && { impressions: updates.impressions }),
      ...(updates.clicks !== undefined && { clicks: updates.clicks }),
      ...(updates.ctr !== undefined && { ctr: updates.ctr }),
      ...(updates.cpc !== undefined && { cpc: updates.cpc }),
      ...(updates.conversions !== undefined && { conversions: updates.conversions }),
      ...(updates.date_start && { dateStart: updates.date_start }),
      ...(updates.date_end && { dateEnd: updates.date_end }),
    },
  });

  return {
    id: adGroup.id,
    campaign_id: adGroup.campaignId,
    name: adGroup.name,
    status: adGroup.status as AdGroup['status'],
    budget: adGroup.budget,
    spent: adGroup.spent,
    impressions: adGroup.impressions,
    clicks: adGroup.clicks,
    ctr: adGroup.ctr,
    cpc: adGroup.cpc,
    conversions: adGroup.conversions,
    date_start: adGroup.dateStart,
    date_end: adGroup.dateEnd,
    created_at: adGroup.createdAt.toISOString(),
    updated_at: adGroup.updatedAt.toISOString(),
  };
}

export async function deleteAdGroup(id: string): Promise<void> {
  await prisma.adGroup.delete({
    where: { id },
  });
}

export async function duplicateAdGroup(id: string): Promise<AdGroup> {
  const original = await prisma.adGroup.findUnique({
    where: { id },
  });

  if (!original) throw new Error('Ad group not found');

  const duplicate = await prisma.adGroup.create({
    data: {
      campaignId: original.campaignId,
      name: `${original.name} (Copy)`,
      status: original.status,
      budget: original.budget,
      ...EMPTY_AD_GROUP_STATS,
      dateStart: original.dateStart,
      dateEnd: original.dateEnd,
    },
  });

  return {
    id: duplicate.id,
    campaign_id: duplicate.campaignId,
    name: duplicate.name,
    status: duplicate.status as AdGroup['status'],
    budget: duplicate.budget,
    spent: duplicate.spent,
    impressions: duplicate.impressions,
    clicks: duplicate.clicks,
    ctr: duplicate.ctr,
    cpc: duplicate.cpc,
    conversions: duplicate.conversions,
    date_start: duplicate.dateStart,
    date_end: duplicate.dateEnd,
    created_at: duplicate.createdAt.toISOString(),
    updated_at: duplicate.updatedAt.toISOString(),
  };
}
