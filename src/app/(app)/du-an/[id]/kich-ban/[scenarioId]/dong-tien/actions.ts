"use server";

import { revalidatePath } from "next/cache";
import { computeAndSaveCashFlow } from "@/lib/db/cashflow";

export type ActionResult = { success: true } | { success: false; error: string };

export async function recomputeCashFlowAction(
  scenarioId: string,
  projectId: string,
  _prevState: ActionResult | null,
  _formData: FormData
): Promise<ActionResult> {
  try {
    await computeAndSaveCashFlow(scenarioId);
    revalidatePath(`/du-an/${projectId}/kich-ban/${scenarioId}/dong-tien`);
    return { success: true };
  } catch (err) {
    console.error("[recomputeCashFlow]", err);
    return {
      success: false,
      error: "Tính toán dòng tiền thất bại. Vui lòng kiểm tra dữ liệu đầu vào và thử lại.",
    };
  }
}
