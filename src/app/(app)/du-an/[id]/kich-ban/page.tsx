import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Plus } from "lucide-react";
import type { Metadata } from "next";
import { getProjectById } from "@/lib/db/projects";
import { listScenariosByProject } from "@/lib/db/scenarios";
import ScenarioTable from "@/components/scenarios/ScenarioTable";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id);
  return {
    title: project
      ? `Kịch bản — ${project.name} | FS Dòng Tiền BĐS`
      : "Kịch bản | FS Dòng Tiền BĐS",
  };
}

export default async function KichBanPage({ params }: Props) {
  const { id } = await params;
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const [project, scenarios] = await Promise.all([
    getProjectById(id),
    listScenariosByProject(id),
  ]);

  if (!project) notFound();
  await assertProjectAccess(session.user.id, id).catch(() => notFound());

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/du-an/${id}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          {project.name}
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Kịch bản</h1>
            <p className="mt-1 text-sm text-gray-500">
              Quản lý các kịch bản tài chính của dự án{" "}
              <span className="font-medium text-gray-700">{project.name}</span>
            </p>
          </div>
          <Link
            href={`/du-an/${id}/kich-ban/tao-moi`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Thêm kịch bản
          </Link>
        </div>
      </div>

      <ScenarioTable scenarios={scenarios} projectId={id} />
    </div>
  );
}
