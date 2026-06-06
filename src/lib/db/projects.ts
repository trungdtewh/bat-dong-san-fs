import { prisma } from "@/lib/prisma";
import type { ProjectFormData } from "@/lib/validations/project";

export async function listProjects() {
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      province: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
  });
}

export async function createProject(data: ProjectFormData) {
  return prisma.project.create({
    data: {
      code: data.code,
      name: data.name,
      type: data.type,
      province: data.province,
      status: data.status,
      totalArea: data.totalArea,
      grossFloorArea: data.grossFloorArea ?? null,
      commercialArea: data.commercialArea ?? null,
    },
  });
}

export async function updateProject(id: string, data: ProjectFormData) {
  return prisma.project.update({
    where: { id },
    data: {
      code: data.code,
      name: data.name,
      type: data.type,
      province: data.province,
      status: data.status,
      totalArea: data.totalArea,
      grossFloorArea: data.grossFloorArea ?? null,
      commercialArea: data.commercialArea ?? null,
    },
  });
}

export async function deleteProject(id: string) {
  return prisma.project.delete({ where: { id } });
}

export async function getProjectWithKPIs(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      scenarios: {
        include: { kpiSnapshot: true },
        orderBy: [{ isBase: "desc" }, { createdAt: "asc" }],
      },
    },
  });
}
