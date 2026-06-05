import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import { getPhaseById } from "@/lib/db/construction-phases";
import { getPackageById } from "@/lib/db/contract-packages";
import CostForm from "@/components/construction/CostForm";
import { createCostAction } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/chi-phi-xay-dung/actions";

interface Props {
  params: Promise<{ id: string; scenarioId: string; phaseId: string; packageId: string }>;
}

export const metadata: Metadata = {
  title: "Thêm hạng mục | FS Dòng Tiền BĐS",
};

export default async function TaoHangMucPage({ params }: Props) {
  const { id: projectId, scenarioId, phaseId, packageId } = await params;
  const [scenario, phase, pkg] = await Promise.all([
    getScenarioById(scenarioId),
    getPhaseById(phaseId),
    getPackageById(packageId),
  ]);
  if (!scenario || scenario.projectId !== projectId) notFound();
  if (!phase || phase.scenarioId !== scenarioId) notFound();
  if (!pkg || pkg.phaseId !== phaseId) notFound();

  const cancelHref = `/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-xay-dung`;
  const boundAction = createCostAction.bind(null, packageId, phaseId, scenarioId, projectId);

  return (
    <div>
      <div className="mb-6">
        <Link href={cancelHref} className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" />
          Quay lại chi phí xây dựng
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Thêm hạng mục chi phí</h1>
        <p className="mt-1 text-sm text-gray-500">
          {scenario.name} · {phase.name} · {pkg.name}
        </p>
      </div>
      <CostForm action={boundAction} cancelHref={cancelHref} />
    </div>
  );
}
