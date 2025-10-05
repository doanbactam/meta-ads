import { prisma } from '@/lib/server/prisma';
import { Creative } from '@/types';

export async function getCreatives(adGroupId?: string): Promise<Creative[]> {
  const creatives = await prisma.creative.findMany({
    where: adGroupId ? { adGroupId } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  return creatives.map((c) => ({
    id: c.id,
    ad_group_id: c.adGroupId,
    name: c.name,
    format: c.format as Creative['format'],
    status: c.status as Creative['status'],
    impressions: c.impressions,
    clicks: c.clicks,
    ctr: c.ctr,
    engagement: c.engagement,
    spend: c.spend,
    roas: c.roas,
    date_start: c.dateStart,
    date_end: c.dateEnd,
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
  }));
}

export async function getCreativeById(id: string): Promise<Creative | null> {
  const creative = await prisma.creative.findUnique({
    where: { id },
  });

  if (!creative) return null;

  return {
    id: creative.id,
    ad_group_id: creative.adGroupId,
    name: creative.name,
    format: creative.format as Creative['format'],
    status: creative.status as Creative['status'],
    impressions: creative.impressions,
    clicks: creative.clicks,
    ctr: creative.ctr,
    engagement: creative.engagement,
    spend: creative.spend,
    roas: creative.roas,
    date_start: creative.dateStart,
    date_end: creative.dateEnd,
    created_at: creative.createdAt.toISOString(),
    updated_at: creative.updatedAt.toISOString(),
  };
}

export async function createCreative(data: Omit<Creative, 'id' | 'created_at' | 'updated_at'>): Promise<Creative> {
  const creative = await prisma.creative.create({
    data: {
      adGroupId: data.ad_group_id,
      name: data.name,
      format: data.format,
      status: data.status,
      impressions: data.impressions || 0,
      clicks: data.clicks || 0,
      ctr: data.ctr || 0,
      engagement: data.engagement || 0,
      spend: data.spend || 0,
      roas: data.roas || 0,
      dateStart: data.date_start,
      dateEnd: data.date_end,
    },
  });

  return {
    id: creative.id,
    ad_group_id: creative.adGroupId,
    name: creative.name,
    format: creative.format as Creative['format'],
    status: creative.status as Creative['status'],
    impressions: creative.impressions,
    clicks: creative.clicks,
    ctr: creative.ctr,
    engagement: creative.engagement,
    spend: creative.spend,
    roas: creative.roas,
    date_start: creative.dateStart,
    date_end: creative.dateEnd,
    created_at: creative.createdAt.toISOString(),
    updated_at: creative.updatedAt.toISOString(),
  };
}

export async function updateCreative(id: string, updates: Partial<Creative>): Promise<Creative> {
  const creative = await prisma.creative.update({
    where: { id },
    data: {
      ...(updates.name && { name: updates.name }),
      ...(updates.format && { format: updates.format }),
      ...(updates.status && { status: updates.status }),
      ...(updates.impressions !== undefined && { impressions: updates.impressions }),
      ...(updates.clicks !== undefined && { clicks: updates.clicks }),
      ...(updates.ctr !== undefined && { ctr: updates.ctr }),
      ...(updates.engagement !== undefined && { engagement: updates.engagement }),
      ...(updates.spend !== undefined && { spend: updates.spend }),
      ...(updates.roas !== undefined && { roas: updates.roas }),
      ...(updates.date_start && { dateStart: updates.date_start }),
      ...(updates.date_end && { dateEnd: updates.date_end }),
    },
  });

  return {
    id: creative.id,
    ad_group_id: creative.adGroupId,
    name: creative.name,
    format: creative.format as Creative['format'],
    status: creative.status as Creative['status'],
    impressions: creative.impressions,
    clicks: creative.clicks,
    ctr: creative.ctr,
    engagement: creative.engagement,
    spend: creative.spend,
    roas: creative.roas,
    date_start: creative.dateStart,
    date_end: creative.dateEnd,
    created_at: creative.createdAt.toISOString(),
    updated_at: creative.updatedAt.toISOString(),
  };
}

export async function deleteCreative(id: string): Promise<void> {
  await prisma.creative.delete({
    where: { id },
  });
}

export async function duplicateCreative(id: string): Promise<Creative> {
  const original = await prisma.creative.findUnique({
    where: { id },
  });

  if (!original) throw new Error('Creative not found');

  const duplicate = await prisma.creative.create({
    data: {
      adGroupId: original.adGroupId,
      name: `${original.name} (Copy)`,
      format: original.format,
      status: original.status,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      engagement: 0,
      spend: 0,
      roas: 0,
      dateStart: original.dateStart,
      dateEnd: original.dateEnd,
    },
  });

  return {
    id: duplicate.id,
    ad_group_id: duplicate.adGroupId,
    name: duplicate.name,
    format: duplicate.format as Creative['format'],
    status: duplicate.status as Creative['status'],
    impressions: duplicate.impressions,
    clicks: duplicate.clicks,
    ctr: duplicate.ctr,
    engagement: duplicate.engagement,
    spend: duplicate.spend,
    roas: duplicate.roas,
    date_start: duplicate.dateStart,
    date_end: duplicate.dateEnd,
    created_at: duplicate.createdAt.toISOString(),
    updated_at: duplicate.updatedAt.toISOString(),
  };
}
