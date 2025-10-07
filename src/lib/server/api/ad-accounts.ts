import type { AdAccountStatus, Platform } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';

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

export async function getAdAccounts(userId: string): Promise<AdAccount[]> {
  // Always require userId to prevent unauthorized access
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error('Valid userId is required to fetch ad accounts');
  }

  const accounts = await prisma.adAccount.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return accounts.map((a) => ({
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

export async function getAdAccountById(id: string, userId: string): Promise<AdAccount | null> {
  // Validate inputs
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Valid account ID is required');
  }
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error('Valid userId is required');
  }

  const account = await prisma.adAccount.findFirst({
    where: { 
      id,
      userId // Ensure user can only access their own accounts
    },
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
  data: Omit<AdAccount, 'id' | 'created_at' | 'updated_at'> & { userId: string }
): Promise<AdAccount> {
  const account = await prisma.adAccount.create({
    data: {
      userId: data.userId,
      name: data.name,
      platform: data.platform as Platform,
      status: data.status as AdAccountStatus,
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

export async function updateAdAccount(id: string, userId: string, updates: Partial<AdAccount>): Promise<AdAccount> {
  // Validate inputs
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Valid account ID is required');
  }
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error('Valid userId is required');
  }

  // First verify the account belongs to the user
  const existingAccount = await prisma.adAccount.findFirst({
    where: { id, userId },
  });

  if (!existingAccount) {
    throw new Error('Ad account not found or access denied');
  }

  const account = await prisma.adAccount.update({
    where: { id },
    data: {
      ...(updates.name && { name: updates.name }),
      ...(updates.platform && { platform: updates.platform as Platform }),
      ...(updates.status && { status: updates.status as AdAccountStatus }),
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

export async function deleteAdAccount(id: string, userId: string): Promise<void> {
  // Validate inputs
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Valid account ID is required');
  }
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error('Valid userId is required');
  }

  // First verify the account belongs to the user
  const existingAccount = await prisma.adAccount.findFirst({
    where: { id, userId },
  });

  if (!existingAccount) {
    throw new Error('Ad account not found or access denied');
  }

  await prisma.adAccount.delete({
    where: { id },
  });
}
