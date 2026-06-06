import { prisma } from "@/lib/prisma";
import type { ProjectRole } from "@/generated/prisma/client";

const ROLE_WEIGHT: Record<ProjectRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  OWNER: 2,
};

export async function assertProjectAccess(
  userId: string,
  projectId: string,
  minRole: ProjectRole = "VIEWER"
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === "ADMIN") return;

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });

  if (!member || ROLE_WEIGHT[member.role] < ROLE_WEIGHT[minRole]) {
    throw new Error("FORBIDDEN");
  }
}

export async function assertScenarioAccess(
  userId: string,
  scenarioId: string,
  minRole: ProjectRole = "VIEWER"
): Promise<void> {
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    select: { projectId: true },
  });
  if (!scenario) throw new Error("NOT_FOUND");
  await assertProjectAccess(userId, scenario.projectId, minRole);
}
