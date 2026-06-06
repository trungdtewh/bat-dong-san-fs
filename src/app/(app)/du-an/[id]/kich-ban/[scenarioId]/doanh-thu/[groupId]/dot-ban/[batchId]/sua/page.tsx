import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import { getGroupById, listGroupsByScenario } from "@/lib/db/product-groups";
import { getBatchById } from "@/lib/db/product-batches";
import ProductBatchForm, {
  type BatchFormGroupContext,
  type BatchInitialData,
} from "@/components/revenue/ProductBatchForm";
import { updateBatchAction } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/doanh-thu/actions";
import type { PriceUnit } from "@/generated/prisma/client";
import type { CollectionInstallment } from "@/lib/validations/product-batch";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";

type DecimalLike = { toString(): string };

interface Props {
  params: Promise<{ id: string; scenarioId: string; groupId: string; batchId: string }>;
}

export const metadata: Metadata = {
  title: "Chỉnh sửa đợt mở bán | FS Dòng Tiền BĐS",
};

export default async function SuaDotBanPage({ params }: Props) {
  const { id: projectId, scenarioId, groupId, batchId } = await params;
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const [scenario, group, batch, allGroups] = await Promise.all([
    getScenarioById(scenarioId),
    getGroupById(groupId),
    getBatchById(batchId),
    listGroupsByScenario(scenarioId),
  ]);
  if (!scenario || scenario.projectId !== projectId) notFound();
  if (!group || group.scenarioId !== scenarioId) notFound();
  if (!batch || batch.groupId !== groupId) notFound();
  await assertProjectAccess(session.user.id, projectId).catch(() => notFound());

  const cancelHref = `/du-an/${projectId}/kich-ban/${scenarioId}/doanh-thu`;
  const boundAction = updateBatchAction.bind(null, batchId, groupId, scenarioId, projectId);

  // usedUnits excludes the current batch being edited
  const usedUnits = (allGroups.find((g) => g.id === groupId)?.batches ?? [])
    .filter((b) => b.id !== batchId)
    .reduce((s, b) => s + b.unitsOffered, 0);

  const groupCtx: BatchFormGroupContext = {
    basePrice: parseFloat((group.basePrice as DecimalLike).toString()),
    area: group.area,
    priceUnit: group.priceUnit as PriceUnit,
    totalUnits: group.totalUnits,
    usedUnits,
  };

  const initialData: BatchInitialData = {
    name: batch.name,
    launchMonth: batch.launchMonth,
    unitsOffered: batch.unitsOffered,
    priceAdjustmentRate: parseFloat((batch.priceAdjustmentRate as DecimalLike).toString()),
    salesVelocity: parseFloat((batch.salesVelocity as DecimalLike).toString()),
    collectionSchedule: batch.collectionSchedule as unknown as CollectionInstallment[],
    notes: batch.notes,
  };

  return (
    <div>
      <div className="mb-6">
        <Link href={cancelHref} className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" />
          Quay lại doanh thu
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Chỉnh sửa đợt mở bán</h1>
        <p className="mt-1 text-sm text-gray-500">
          {scenario.name} · {group.name}
        </p>
      </div>
      <ProductBatchForm
        action={boundAction}
        group={groupCtx}
        initialData={initialData}
        cancelHref={cancelHref}
      />
    </div>
  );
}
