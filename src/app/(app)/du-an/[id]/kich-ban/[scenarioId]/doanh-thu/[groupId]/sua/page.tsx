import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import { getGroupById } from "@/lib/db/product-groups";
import ProductGroupForm, { type GroupInitialData } from "@/components/revenue/ProductGroupForm";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";
import { updateGroupAction } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/doanh-thu/actions";

type DecimalLike = { toString(): string };

interface Props {
  params: Promise<{ id: string; scenarioId: string; groupId: string }>;
}

export const metadata: Metadata = {
  title: "Chỉnh sửa nhóm sản phẩm | FS Dòng Tiền BĐS",
};

export default async function SuaNhomPage({ params }: Props) {
  const { id: projectId, scenarioId, groupId } = await params;
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const [scenario, group] = await Promise.all([
    getScenarioById(scenarioId),
    getGroupById(groupId),
  ]);
  if (!scenario || scenario.projectId !== projectId) notFound();
  if (!group || group.scenarioId !== scenarioId) notFound();
  await assertProjectAccess(session.user.id, projectId).catch(() => notFound());

  const cancelHref = `/du-an/${projectId}/kich-ban/${scenarioId}/doanh-thu`;
  const boundAction = updateGroupAction.bind(null, groupId, scenarioId, projectId);

  const initialData: GroupInitialData = {
    productCode: group.productCode,
    name: group.name,
    productType: group.productType,
    totalUnits: group.totalUnits,
    priceUnit: group.priceUnit,
    area: group.area,
    basePrice: parseFloat((group.basePrice as DecimalLike).toString()),
    vatRate: parseFloat((group.vatRate as DecimalLike).toString()),
    notes: group.notes,
  };

  return (
    <div>
      <div className="mb-6">
        <Link href={cancelHref} className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" />
          Quay lại doanh thu
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Chỉnh sửa nhóm sản phẩm</h1>
        <p className="mt-1 text-sm text-gray-500">{scenario.name}</p>
      </div>
      <ProductGroupForm action={boundAction} initialData={initialData} cancelHref={cancelHref} />
    </div>
  );
}
