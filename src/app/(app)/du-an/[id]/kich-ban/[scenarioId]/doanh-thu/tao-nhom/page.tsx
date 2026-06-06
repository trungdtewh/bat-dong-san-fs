import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import ProductGroupForm from "@/components/revenue/ProductGroupForm";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";
import { createGroupAction } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/doanh-thu/actions";

interface Props {
  params: Promise<{ id: string; scenarioId: string }>;
}

export const metadata: Metadata = {
  title: "Thêm nhóm sản phẩm | FS Dòng Tiền BĐS",
};

export default async function TaoNhomPage({ params }: Props) {
  const { id: projectId, scenarioId } = await params;
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const scenario = await getScenarioById(scenarioId);
  if (!scenario || scenario.projectId !== projectId) notFound();
  await assertProjectAccess(session.user.id, projectId).catch(() => notFound());

  const cancelHref = `/du-an/${projectId}/kich-ban/${scenarioId}/doanh-thu`;
  const boundAction = createGroupAction.bind(null, scenarioId, projectId);

  return (
    <div>
      <div className="mb-6">
        <Link href={cancelHref} className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" />
          Quay lại doanh thu
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Thêm nhóm sản phẩm</h1>
        <p className="mt-1 text-sm text-gray-500">{scenario.name}</p>
      </div>
      <ProductGroupForm action={boundAction} cancelHref={cancelHref} />
    </div>
  );
}
