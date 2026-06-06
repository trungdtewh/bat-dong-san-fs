import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";
import { getPhaseById } from "@/lib/db/construction-phases";
import PhaseForm from "@/components/construction/PhaseForm";
import { updatePhaseAction } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/chi-phi-xay-dung/actions";

interface Props {
  params: Promise<{ id: string; scenarioId: string; phaseId: string }>;
}

export const metadata: Metadata = {
  title: "Chỉnh sửa giai đoạn | FS Dòng Tiền BĐS",
};

export default async function SuaGiaiDoanPage({ params }: Props) {
  const { id: projectId, scenarioId, phaseId } = await params;
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const [scenario, phase] = await Promise.all([
    getScenarioById(scenarioId),
    getPhaseById(phaseId),
  ]);
  if (!scenario || scenario.projectId !== projectId) notFound();
  if (!phase || phase.scenarioId !== scenarioId) notFound();
  await assertProjectAccess(session.user.id, projectId).catch(() => notFound());

  const cancelHref = `/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-xay-dung`;
  const boundAction = updatePhaseAction.bind(null, phaseId, scenarioId, projectId);

  return (
    <div>
      <div className="mb-6">
        <Link href={cancelHref} className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" />
          Quay lại chi phí xây dựng
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Chỉnh sửa giai đoạn thi công</h1>
        <p className="mt-1 text-sm text-gray-500">{scenario.name}</p>
      </div>
      <PhaseForm
        action={boundAction}
        initialData={{
          name: phase.name,
          startMonth: phase.startMonth,
          endMonth: phase.endMonth,
          description: phase.description,
        }}
        cancelHref={cancelHref}
      />
    </div>
  );
}
