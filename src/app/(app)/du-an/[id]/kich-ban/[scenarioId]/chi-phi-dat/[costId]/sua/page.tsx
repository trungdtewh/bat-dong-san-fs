import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import { getLandCostById } from "@/lib/db/land-costs";
import LandCostForm, {
  type LandCostInitialData,
} from "@/components/land-costs/LandCostForm";
import { updateLandCostAction } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/chi-phi-dat/actions";

type DecimalLike = { toString(): string };

function toNum(d: DecimalLike | null | undefined): number | null {
  return d != null ? parseFloat(d.toString()) : null;
}

interface Props {
  params: Promise<{ id: string; scenarioId: string; costId: string }>;
}

export const metadata: Metadata = {
  title: "Chỉnh sửa chi phí đất | FS Dòng Tiền BĐS",
};

export default async function SuaChiPhiDatPage({ params }: Props) {
  const { id: projectId, scenarioId, costId } = await params;

  const [scenario, cost] = await Promise.all([
    getScenarioById(scenarioId),
    getLandCostById(costId),
  ]);

  if (!scenario || scenario.projectId !== projectId) notFound();
  if (!cost || cost.scenarioId !== scenarioId) notFound();

  const initialData: LandCostInitialData = {
    category: cost.category,
    name: cost.name,
    description: cost.description,
    area: cost.area,
    unitPrice: toNum(cost.unitPrice),
    totalAmount: toNum(cost.totalAmount),
    paymentMonth: cost.paymentMonth,
    notes: cost.notes,
  };

  const boundAction = updateLandCostAction.bind(
    null,
    costId,
    scenarioId,
    projectId
  );
  const cancelHref = `/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-dat`;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={cancelHref}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại chi phí đất
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">
          Chỉnh sửa chi phí đất
        </h1>
        <p className="mt-1 text-sm text-gray-500">{scenario.name}</p>
      </div>

      <LandCostForm
        action={boundAction}
        initialData={initialData}
        cancelHref={cancelHref}
      />
    </div>
  );
}
