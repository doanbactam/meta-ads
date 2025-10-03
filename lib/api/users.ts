import { prisma } from '@/lib/prisma';

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
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
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

export async function createUser(data: {
  clerkId: string;
  email: string;
  name?: string;
}): Promise<User> {
  const user = await prisma.user.create({
    data: {
      clerkId: data.clerkId,
      email: data.email,
      name: data.name || null,
    },
  });

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

export async function updateUser(
  clerkId: string,
  updates: { email?: string; name?: string }
): Promise<User> {
  const user = await prisma.user.update({
    where: { clerkId },
    data: {
      ...(updates.email && { email: updates.email }),
      ...(updates.name !== undefined && { name: updates.name }),
    },
  });

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

export async function deleteUser(clerkId: string): Promise<void> {
  await prisma.user.delete({
    where: { clerkId },
  });
}
