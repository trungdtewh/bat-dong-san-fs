"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assumptionSchema } from "@/lib/validations/assumption";
import { upsertAssumption } from "@/lib/db/assumptions";
import { assertScenarioAccess } from "@/lib/db/access";
import { getRequiredSession } from "@/lib/auth/session";

export type AssumptionActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
} | null;

function parseFormData(formData: FormData) {
  const get = (key: string) => formData.get(key) || undefined;
  return {
    inflationRate: get("inflationRate"),
    priceEscalationRate: get("priceEscalationRate"),
    constructionEscalationRate: get("constructionEscalationRate"),
    landPriceEscalationRate: get("landPriceEscalationRate"),
    corporateTaxRate: get("corporateTaxRate"),
    vatRate: get("vatRate"),
    landTransferTaxRate: get("landTransferTaxRate"),
    salesCommissionRate: get("salesCommissionRate"),
    marketingCostRate: get("marketingCostRate"),
    contingencyRate: get("contingencyRate"),
    debtRatio: get("debtRatio"),
    equityRatio: get("equityRatio"),
    loanInterestRate: get("loanInterestRate"),
    loanTenorMonths: get("loanTenorMonths"),
    gracePeriodMonths: get("gracePeriodMonths"),
    notes: get("notes"),
  };
}

export async function upsertAssumptionAction(
  scenarioId: string,
  projectId: string,
  _prev: AssumptionActionState,
  formData: FormData
): Promise<AssumptionActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const result = assumptionSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await upsertAssumption(scenarioId, result.data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "FORBIDDEN") {
      return { success: false, message: "Bạn không có quyền thực hiện hành động này." };
    }
    return { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }

  revalidatePath(`/du-an/${projectId}/kich-ban/${scenarioId}`);
  revalidatePath(`/du-an/${projectId}/kich-ban/${scenarioId}/gia-dinh`);
  redirect(`/du-an/${projectId}/kich-ban/${scenarioId}/gia-dinh`);
}
