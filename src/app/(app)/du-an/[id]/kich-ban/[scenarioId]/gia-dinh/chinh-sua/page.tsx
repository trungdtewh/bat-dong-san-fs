import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import { getAssumptionByScenarioId } from "@/lib/db/assumptions";
import AssumptionForm, { type AssumptionInitialData } from "@/components/assumptions/AssumptionForm";
import { upsertAssumptionAction } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/gia-dinh/actions";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";

type AssumptionRow = Awaited<ReturnType<typeof getAssumptionByScenarioId>>;
type DecimalLike = { toString(): string };

function toNum(d: DecimalLike | null): number | null {
  return d != null ? parseFloat(d.toString()) * 100 : null;
}

function serializeAssumption(a: NonNullable<AssumptionRow>): AssumptionInitialData {
  return {
    inflationRate: parseFloat(a.inflationRate.toString()) * 100,
    priceEscalationRate: toNum(a.priceEscalationRate),
    constructionEscalationRate: toNum(a.constructionEscalationRate),
    landPriceEscalationRate: toNum(a.landPriceEscalationRate),
    corporateTaxRate: parseFloat(a.corporateTaxRate.toString()) * 100,
    vatRate: parseFloat(a.vatRate.toString()) * 100,
    landTransferTaxRate: toNum(a.landTransferTaxRate),
    salesCommissionRate: parseFloat(a.salesCommissionRate.toString()) * 100,
    marketingCostRate: toNum(a.marketingCostRate),
    contingencyRate: parseFloat(a.contingencyRate.toString()) * 100,
    debtRatio: toNum(a.debtRatio),
    equityRatio: toNum(a.equityRatio),
    loanInterestRate: toNum(a.loanInterestRate),
    loanTenorMonths: a.loanTenorMonths,
    gracePeriodMonths: a.gracePeriodMonths,
    notes: a.notes,
  };
}

interface Props {
  params: Promise<{ id: string; scenarioId: string }>;
}

export const metadata: Metadata = {
  title: "Chỉnh sửa giả định | FS Dòng Tiền BĐS",
};

export default async function ChinhSuaGiaDinhPage({ params }: Props) {
  const { id: projectId, scenarioId } = await params;
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const [scenario, assumption] = await Promise.all([
    getScenarioById(scenarioId),
    getAssumptionByScenarioId(scenarioId),
  ]);

  if (!scenario || scenario.projectId !== projectId) notFound();
  await assertProjectAccess(session.user.id, projectId).catch(() => notFound());

  const boundAction = upsertAssumptionAction.bind(null, scenarioId, projectId);
  const cancelHref = `/du-an/${projectId}/kich-ban/${scenarioId}/gia-dinh`;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={cancelHref}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại giả định
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">
          {assumption ? "Chỉnh sửa giả định" : "Thêm giả định"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{scenario.name}</p>
      </div>

      <AssumptionForm
        action={boundAction}
        initialData={assumption ? serializeAssumption(assumption) : undefined}
        cancelHref={cancelHref}
      />
    </div>
  );
}
