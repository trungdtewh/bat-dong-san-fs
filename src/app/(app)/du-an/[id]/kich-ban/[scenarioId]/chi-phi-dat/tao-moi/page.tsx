import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import LandCostForm from "@/components/land-costs/LandCostForm";
import { createLandCostAction } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/chi-phi-dat/actions";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";

interface Props {
  params: Promise<{ id: string; scenarioId: string }>;
}

export const metadata: Metadata = {
  title: "Thêm chi phí đất | FS Dòng Tiền BĐS",
};

export default async function TaoMoiChiPhiDatPage({ params }: Props) {
  const { id: projectId, scenarioId } = await params;
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const scenario = await getScenarioById(scenarioId);
  if (!scenario || scenario.projectId !== projectId) notFound();
  await assertProjectAccess(session.user.id, projectId).catch(() => notFound());

  const boundAction = createLandCostAction.bind(null, scenarioId, projectId);
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
          Thêm mục chi phí đất
        </h1>
        <p className="mt-1 text-sm text-gray-500">{scenario.name}</p>
      </div>

      <LandCostForm action={boundAction} cancelHref={cancelHref} />
    </div>
  );
}
