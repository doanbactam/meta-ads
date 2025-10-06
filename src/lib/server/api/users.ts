import { prisma } from '@/lib/server/prisma';

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
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
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

export async function createUser(data: {
  clerkId: string;
  email: string;
  name?: string;
  imageUrl?: string;
}): Promise<User> {
  const user = await prisma.user.create({
    data: {
      clerkId: data.clerkId,
      email: data.email,
      name: data.name || null,
      imageUrl: data.imageUrl || null,
    },
  });

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
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
  }
): Promise<User> {
  const user = await prisma.user.update({
    where: { clerkId },
    data: {
      ...(updates.email && { email: updates.email }),
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.imageUrl !== undefined && { imageUrl: updates.imageUrl }),
    },
  });

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
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