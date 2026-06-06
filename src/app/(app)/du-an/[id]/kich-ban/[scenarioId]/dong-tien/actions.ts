"use server";

import { revalidatePath } from "next/cache";
import { computeAndSaveCashFlow } from "@/lib/db/cashflow";
import { assertScenarioAccess } from "@/lib/db/access";
import { getRequiredSession } from "@/lib/auth/session";

export type ActionResult = { success: true } | { success: false; error: string };

export async function recomputeCashFlowAction(
  scenarioId: string,
  projectId: string,
  _prevState: ActionResult | null,
  _formData: FormData
): Promise<ActionResult> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) {
    return { success: false, error: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại." };
  }

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await computeAndSaveCashFlow(scenarioId);
    revalidatePath(`/du-an/${projectId}/kich-ban/${scenarioId}/dong-tien`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "FORBIDDEN") {
      return { success: false, error: "Bạn không có quyền thực hiện hành động này." };
    }
    console.error("[recomputeCashFlow]", err);
    return {
      success: false,
      error: "Tính toán dòng tiền thất bại. Vui lòng kiểm tra dữ liệu đầu vào và thử lại.",
    };
  }
}
