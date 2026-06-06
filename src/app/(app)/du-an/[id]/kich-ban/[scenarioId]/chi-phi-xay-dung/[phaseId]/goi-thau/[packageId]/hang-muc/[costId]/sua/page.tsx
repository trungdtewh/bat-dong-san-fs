import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";
import { getPhaseById } from "@/lib/db/construction-phases";
import { getPackageById } from "@/lib/db/contract-packages";
import { getCostById } from "@/lib/db/construction-costs";
import CostForm, { type CostInitialData } from "@/components/construction/CostForm";
import { updateCostAction } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/chi-phi-xay-dung/actions";

type DecimalLike = { toString(): string };

interface Props {
  params: Promise<{
    id: string;
    scenarioId: string;
    phaseId: string;
    packageId: string;
    costId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Chỉnh sửa hạng mục | FS Dòng Tiền BĐS",
};

export default async function SuaHangMucPage({ params }: Props) {
  const { id: projectId, scenarioId, phaseId, packageId, costId } = await params;
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const [scenario, phase, pkg, cost] = await Promise.all([
    getScenarioById(scenarioId),
    getPhaseById(phaseId),
    getPackageById(packageId),
    getCostById(costId),
  ]);
  if (!scenario || scenario.projectId !== projectId) notFound();
  if (!phase || phase.scenarioId !== scenarioId) notFound();
  if (!pkg || pkg.phaseId !== phaseId) notFound();
  if (!cost || cost.packageId !== packageId) notFound();
  await assertProjectAccess(session.user.id, projectId).catch(() => notFound());

  const cancelHref = `/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-xay-dung`;
  const boundAction = updateCostAction.bind(null, costId, phaseId, scenarioId, projectId);

  const toNum = (d: DecimalLike | null | undefined) =>
    d != null ? parseFloat(d.toString()) : null;

  const initialData: CostInitialData = {
    category: cost.category,
    name: cost.name,
    description: cost.description,
    unit: cost.unit,
    quantity: cost.quantity,
    unitPrice: toNum(cost.unitPrice),
    totalAmount: toNum(cost.totalAmount),
  };

  return (
    <div>
      <div className="mb-6">
        <Link href={cancelHref} className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" />
          Quay lại chi phí xây dựng
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Chỉnh sửa hạng mục chi phí</h1>
        <p className="mt-1 text-sm text-gray-500">
          {scenario.name} · {phase.name} · {pkg.name}
        </p>
      </div>
      <CostForm action={boundAction} initialData={initialData} cancelHref={cancelHref} />
    </div>
  );
}
