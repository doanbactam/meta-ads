import { prisma } from '@/lib/prisma';
import { UserRole, SubscriptionPackage } from '@prisma/client';

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  role: UserRole;
  subscriptionPackage: SubscriptionPackage;
  subscriptionExpiry: string | null;
  created_at: string;
  updated_at: string;
}

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) return null;

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
    role: user.role,
    subscriptionPackage: user.subscriptionPackage,
    subscriptionExpiry: user.subscriptionExpiry?.toISOString() || null,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

export async function createUser(data: {
  clerkId: string;
  email: string;
  name?: string;
  imageUrl?: string;
  role?: UserRole;
  subscriptionPackage?: SubscriptionPackage;
}): Promise<User> {
  const user = await prisma.user.create({
    data: {
      clerkId: data.clerkId,
      email: data.email,
      name: data.name || null,
      imageUrl: data.imageUrl || null,
      role: data.role || 'USER',
      subscriptionPackage: data.subscriptionPackage || 'FREE',
    },
  });

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
    role: user.role,
    subscriptionPackage: user.subscriptionPackage,
    subscriptionExpiry: user.subscriptionExpiry?.toISOString() || null,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

export async function updateUser(
  clerkId: string,
  updates: {
    email?: string;
    name?: string;
    imageUrl?: string;
    role?: UserRole;
    subscriptionPackage?: SubscriptionPackage;
    subscriptionExpiry?: Date;
  }
): Promise<User> {
  const user = await prisma.user.update({
    where: { clerkId },
    data: {
      ...(updates.email && { email: updates.email }),
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.imageUrl !== undefined && { imageUrl: updates.imageUrl }),
      ...(updates.role && { role: updates.role }),
      ...(updates.subscriptionPackage && { subscriptionPackage: updates.subscriptionPackage }),
      ...(updates.subscriptionExpiry !== undefined && { subscriptionExpiry: updates.subscriptionExpiry }),
    },
  });

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
    role: user.role,
    subscriptionPackage: user.subscriptionPackage,
    subscriptionExpiry: user.subscriptionExpiry?.toISOString() || null,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

export async function deleteUser(clerkId: string): Promise<void> {
  await prisma.user.delete({
    where: { clerkId },
  });
}

export async function getOrCreateUserFromClerk(clerkId: string) {
  let user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    // Auto-create user if they don't exist in database
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);

    user = await prisma.user.create({
      data: {
        clerkId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
        imageUrl: clerkUser.imageUrl || null,
      },
    });
  }

  return user;
}
