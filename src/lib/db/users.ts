import { prisma } from "@/lib/prisma";

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function updateUserName(id: string, name: string) {
  return prisma.user.update({
    where: { id },
    data: { name },
    select: { id: true, name: true },
  });
}

export async function updateUserPassword(id: string, passwordHash: string) {
  return prisma.user.update({
    where: { id },
    data: { passwordHash },
    select: { id: true },
  });
}
