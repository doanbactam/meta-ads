import { prisma } from '@/lib/prisma';

export interface AdAccount {
  id: string;
  name: string;
  platform: string;
  status: string;
  currency: string;
  timeZone: string;
  created_at: string;
  updated_at: string;
}

export async function getAdAccounts(): Promise<AdAccount[]> {
  const accounts = await prisma.adAccount.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return accounts.map(a => ({
    id: a.id,
    name: a.name,
    platform: a.platform,
    status: a.status,
    currency: a.currency,
    timeZone: a.timeZone,
    created_at: a.createdAt.toISOString(),
    updated_at: a.updatedAt.toISOString(),
  }));
}

export async function getAdAccountById(id: string): Promise<AdAccount | null> {
  const account = await prisma.adAccount.findUnique({
    where: { id },
  });

  if (!account) return null;

  return {
    id: account.id,
    name: account.name,
    platform: account.platform,
    status: account.status,
    currency: account.currency,
    timeZone: account.timeZone,
    created_at: account.createdAt.toISOString(),
    updated_at: account.updatedAt.toISOString(),
  };
}

export async function createAdAccount(
  data: Omit<AdAccount, 'id' | 'created_at' | 'updated_at'>
): Promise<AdAccount> {
  const account = await prisma.adAccount.create({
    data: {
      name: data.name,
      platform: data.platform,
      status: data.status,
      currency: data.currency || 'USD',
      timeZone: data.timeZone || 'UTC',
    },
  });

  return {
    id: account.id,
    name: account.name,
    platform: account.platform,
    status: account.status,
    currency: account.currency,
    timeZone: account.timeZone,
    created_at: account.createdAt.toISOString(),
    updated_at: account.updatedAt.toISOString(),
  };
}

export async function updateAdAccount(id: string, updates: Partial<AdAccount>): Promise<AdAccount> {
  const account = await prisma.adAccount.update({
    where: { id },
    data: {
      ...(updates.name && { name: updates.name }),
      ...(updates.platform && { platform: updates.platform }),
      ...(updates.status && { status: updates.status }),
      ...(updates.currency && { currency: updates.currency }),
      ...(updates.timeZone && { timeZone: updates.timeZone }),
    },
  });

  return {
    id: account.id,
    name: account.name,
    platform: account.platform,
    status: account.status,
    currency: account.currency,
    timeZone: account.timeZone,
    created_at: account.createdAt.toISOString(),
    updated_at: account.updatedAt.toISOString(),
  };
}

export async function deleteAdAccount(id: string): Promise<void> {
  await prisma.adAccount.delete({
    where: { id },
  });
}
