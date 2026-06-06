import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";
import { getPhaseById } from "@/lib/db/construction-phases";
import { getPackageById } from "@/lib/db/contract-packages";
import PackageForm, { type PackageInitialData } from "@/components/construction/PackageForm";
import { updatePackageAction } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/chi-phi-xay-dung/actions";

type DecimalLike = { toString(): string };

interface Props {
  params: Promise<{ id: string; scenarioId: string; phaseId: string; packageId: string }>;
}

export const metadata: Metadata = {
  title: "Chỉnh sửa gói thầu | FS Dòng Tiền BĐS",
};

export default async function SuaGoiThauPage({ params }: Props) {
  const { id: projectId, scenarioId, phaseId, packageId } = await params;
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const [scenario, phase, pkg] = await Promise.all([
    getScenarioById(scenarioId),
    getPhaseById(phaseId),
    getPackageById(packageId),
  ]);
  if (!scenario || scenario.projectId !== projectId) notFound();
  if (!phase || phase.scenarioId !== scenarioId) notFound();
  if (!pkg || pkg.phaseId !== phaseId) notFound();
  await assertProjectAccess(session.user.id, projectId).catch(() => notFound());

  const cancelHref = `/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-xay-dung`;
  const boundAction = updatePackageAction.bind(null, packageId, phaseId, scenarioId, projectId);

  const customDist = Array.isArray(pkg.customDistribution)
    ? (pkg.customDistribution as number[])
    : null;

  const initialData: PackageInitialData = {
    name: pkg.name,
    contractorName: pkg.contractorName,
    contractValue: parseFloat((pkg.contractValue as DecimalLike).toString()),
    startMonth: pkg.startMonth,
    endMonth: pkg.endMonth,
    distributionType: pkg.distributionType,
    customDistribution: customDist,
    notes: pkg.notes,
  };

  return (
    <div>
      <div className="mb-6">
        <Link href={cancelHref} className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" />
          Quay lại chi phí xây dựng
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Chỉnh sửa gói thầu</h1>
        <p className="mt-1 text-sm text-gray-500">
          {scenario.name} · Giai đoạn: {phase.name}
        </p>
      </div>
      <PackageForm action={boundAction} initialData={initialData} cancelHref={cancelHref} />
    </div>
  );
}
