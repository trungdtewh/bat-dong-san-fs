import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";

export async function getAdminStats() {
  const [userCount, projectCount, scenarioCount, memberCount] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.scenario.count(),
    prisma.projectMember.count(),
  ]);
  return { userCount, projectCount, scenarioCount, memberCount };
}

export async function listAllUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function listAllProjects() {
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      status: true,
      createdAt: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { members: true, scenarios: true },
      },
    },
  });
}

export async function updateUserRole(userId: string, role: UserRole) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, role: true },
  });
}
