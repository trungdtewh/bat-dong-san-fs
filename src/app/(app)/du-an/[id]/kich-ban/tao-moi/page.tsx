import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getProjectById } from "@/lib/db/projects";
import { getBaseScenario } from "@/lib/db/scenarios";
import ScenarioForm from "@/components/scenarios/ScenarioForm";
import { createScenarioAction } from "@/app/(app)/du-an/[id]/kich-ban/actions";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Tạo kịch bản | FS Dòng Tiền BĐS",
};

export default async function TaoMoiKichBanPage({ params }: Props) {
  const { id } = await params;
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const [project, baseScenario] = await Promise.all([
    getProjectById(id),
    getBaseScenario(id),
  ]);

  if (!project) notFound();
  await assertProjectAccess(session.user.id, id).catch(() => notFound());

  const boundAction = createScenarioAction.bind(null, id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/du-an/${id}/kich-ban`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại danh sách kịch bản
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">
          Tạo kịch bản mới
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Thêm kịch bản tài chính cho dự án{" "}
          <span className="font-medium text-gray-700">{project.name}</span>
        </p>
      </div>

      <ScenarioForm
        action={boundAction}
        cancelHref={`/du-an/${id}/kich-ban`}
        submitLabel="Tạo kịch bản"
        disableIsBase={!!baseScenario}
      />
    </div>
  );
}
