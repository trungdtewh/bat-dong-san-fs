import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import { getGroupById } from "@/lib/db/product-groups";
import { listGroupsByScenario } from "@/lib/db/product-groups";
import ProductBatchForm, { type BatchFormGroupContext } from "@/components/revenue/ProductBatchForm";
import { createBatchAction } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/doanh-thu/actions";
import type { PriceUnit } from "@/generated/prisma/client";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";

type DecimalLike = { toString(): string };

interface Props {
  params: Promise<{ id: string; scenarioId: string; groupId: string }>;
}

export const metadata: Metadata = {
  title: "Thêm đợt mở bán | FS Dòng Tiền BĐS",
};

export default async function TaoDotBanPage({ params }: Props) {
  const { id: projectId, scenarioId, groupId } = await params;
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const [scenario, group, allGroups] = await Promise.all([
    getScenarioById(scenarioId),
    getGroupById(groupId),
    listGroupsByScenario(scenarioId),
  ]);
  if (!scenario || scenario.projectId !== projectId) notFound();
  if (!group || group.scenarioId !== scenarioId) notFound();
  await assertProjectAccess(session.user.id, projectId).catch(() => notFound());

  const cancelHref = `/du-an/${projectId}/kich-ban/${scenarioId}/doanh-thu`;
  const boundAction = createBatchAction.bind(null, groupId, scenarioId, projectId);

  const usedUnits = (allGroups.find((g) => g.id === groupId)?.batches ?? []).reduce(
    (s, b) => s + b.unitsOffered,
    0
  );

  const groupCtx: BatchFormGroupContext = {
    basePrice: parseFloat((group.basePrice as DecimalLike).toString()),
    area: group.area,
    priceUnit: group.priceUnit as PriceUnit,
    totalUnits: group.totalUnits,
    usedUnits,
  };

  return (
    <div>
      <div className="mb-6">
        <Link href={cancelHref} className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" />
          Quay lại doanh thu
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Thêm đợt mở bán</h1>
        <p className="mt-1 text-sm text-gray-500">
          {scenario.name} · {group.name}
        </p>
      </div>
      <ProductBatchForm action={boundAction} group={groupCtx} cancelHref={cancelHref} />
    </div>
  );
}
