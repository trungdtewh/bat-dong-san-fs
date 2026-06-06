import { prisma } from "@/lib/prisma";
import type { ProjectRole } from "@/generated/prisma/client";

export async function listProjectMembers(projectId: string) {
  return prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getProjectMemberRole(
  projectId: string,
  userId: string
): Promise<ProjectRole | null> {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  return member?.role ?? null;
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });
}

export async function addProjectMember(
  projectId: string,
  userId: string,
  role: ProjectRole
) {
  return prisma.projectMember.create({
    data: { projectId, userId, role },
  });
}

export async function updateProjectMemberRole(
  projectId: string,
  memberId: string,
  role: ProjectRole
) {
  return prisma.projectMember.update({
    where: { id: memberId, projectId },
    data: { role },
  });
}

export async function removeProjectMember(projectId: string, memberId: string) {
  return prisma.projectMember.delete({
    where: { id: memberId, projectId },
  });
}
