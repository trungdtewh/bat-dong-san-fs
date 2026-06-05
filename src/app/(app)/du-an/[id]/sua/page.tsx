import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getProjectById } from "@/lib/db/projects";
import ProjectForm from "@/components/projects/ProjectForm";
import { updateProjectAction } from "@/app/(app)/du-an/actions";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Chỉnh sửa dự án | FS Dòng Tiền BĐS",
};

export default async function SuaDuAnPage({ params }: Props) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) notFound();

  const boundAction = updateProjectAction.bind(null, project.id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/du-an/${project.id}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại chi tiết
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Chỉnh sửa dự án</h1>
        <p className="mt-1 text-sm text-gray-500">{project.name}</p>
      </div>

      <ProjectForm
        action={boundAction}
        initialData={{
          code: project.code,
          name: project.name,
          type: project.type,
          province: project.province,
          status: project.status,
          totalArea: project.totalArea,
          grossFloorArea: project.grossFloorArea,
          commercialArea: project.commercialArea,
        }}
        cancelHref={`/du-an/${project.id}`}
        submitLabel="Lưu thay đổi"
      />
    </div>
  );
}
