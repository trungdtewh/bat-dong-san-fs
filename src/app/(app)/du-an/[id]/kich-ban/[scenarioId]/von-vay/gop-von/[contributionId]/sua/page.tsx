import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import { getEquityById } from "@/lib/db/equity-contributions";
import EquityForm from "@/components/equity/EquityForm";
import type { EquitySourceType } from "@/generated/prisma/client";
import { updateEquityAction } from "../../actions";

interface Props {
  params: Promise<{ id: string; scenarioId: string; contributionId: string }>;
}

export const metadata: Metadata = {
  title: "Chỉnh sửa góp vốn | FS Dòng Tiền BĐS",
};

function toNum(d: { toString(): string } | null | undefined): number {
  return d != null ? parseFloat(d.toString()) : 0;
}

export default async function SuaGopVonPage({ params }: Props) {
  const { id: projectId, scenarioId, contributionId } = await params;
  const [scenario, equity] = await Promise.all([
    getScenarioById(scenarioId),
    getEquityById(contributionId),
  ]);
  if (!scenario || scenario.projectId !== projectId) notFound();
  if (!equity || equity.scenarioId !== scenarioId) notFound();

  const baseHref = `/du-an/${projectId}/kich-ban/${scenarioId}/von-vay`;
  const action = updateEquityAction.bind(null, contributionId, scenarioId, projectId);

  const milestones = equity.paymentSchedule?.milestones ?? [];
  const disbursements = milestones.map((m) => ({
    projectMonth: m.projectMonth,
    amount: toNum(m.amount),
    description: m.description ?? "",
  }));

  const initialData = {
    name: equity.name,
    contributorName: equity.contributorName,
    sourceType: equity.sourceType as EquitySourceType,
    totalAmount: toNum(equity.totalAmount),
    disbursements: disbursements.length
      ? disbursements
      : [{ projectMonth: 1, amount: toNum(equity.totalAmount), description: "" }],
    notes: equity.notes,
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href={baseHref}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại vốn vay
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Chỉnh sửa góp vốn</h1>
        <p className="mt-1 text-sm text-gray-500">{equity.name}</p>
      </div>

      <div className="max-w-3xl">
        <EquityForm action={action} initialData={initialData} cancelHref={baseHref} />
      </div>
    </div>
  );
}
