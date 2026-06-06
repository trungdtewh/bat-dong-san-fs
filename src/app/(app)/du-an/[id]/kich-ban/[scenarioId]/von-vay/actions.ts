"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loanSchema } from "@/lib/validations/loan";
import { createLoan, updateLoan, deleteLoan } from "@/lib/db/loans";
import { assertScenarioAccess } from "@/lib/db/access";
import { getRequiredSession } from "@/lib/auth/session";

export type LoanActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
} | null;

function parseFormData(formData: FormData) {
  const get = (key: string) => formData.get(key) || undefined;
  return {
    name: get("name"),
    lenderName: get("lenderName"),
    type: get("type"),
    status: get("status"),
    principalAmount: get("principalAmount"),
    interestRatePct: get("interestRatePct"),
    tenorMonths: get("tenorMonths"),
    gracePeriodMonths: get("gracePeriodMonths"),
    startMonth: get("startMonth"),
    capitalizedInterest: get("capitalizedInterest"),
    repaymentMethod: get("repaymentMethod"),
    disbursementsJson: get("disbursementsJson"),
    notes: get("notes"),
  };
}

function revalidate(projectId: string, scenarioId: string) {
  revalidatePath(`/du-an/${projectId}/kich-ban/${scenarioId}/von-vay`);
}

function handleError(err: unknown): LoanActionState {
  const msg = err instanceof Error ? err.message : "";
  if (msg === "FORBIDDEN") {
    return { success: false, message: "Bạn không có quyền thực hiện hành động này." };
  }
  return { success: false, message: msg || "Có lỗi xảy ra, vui lòng thử lại." };
}

export async function createLoanAction(
  scenarioId: string,
  projectId: string,
  _prev: LoanActionState,
  formData: FormData
): Promise<LoanActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const result = loanSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }
  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await createLoan(scenarioId, result.data);
  } catch (err) {
    return handleError(err);
  }
  revalidate(projectId, scenarioId);
  redirect(`/du-an/${projectId}/kich-ban/${scenarioId}/von-vay`);
}

export async function updateLoanAction(
  loanId: string,
  scenarioId: string,
  projectId: string,
  _prev: LoanActionState,
  formData: FormData
): Promise<LoanActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const result = loanSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }
  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await updateLoan(loanId, result.data);
  } catch (err) {
    return handleError(err);
  }
  revalidate(projectId, scenarioId);
  redirect(`/du-an/${projectId}/kich-ban/${scenarioId}/von-vay`);
}

export async function deleteLoanAction(
  loanId: string,
  scenarioId: string,
  projectId: string
): Promise<{ success: boolean; message?: string }> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await deleteLoan(loanId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "FORBIDDEN") {
      return { success: false, message: "Bạn không có quyền thực hiện hành động này." };
    }
    return { success: false, message: "Có lỗi xảy ra khi xóa khoản vay." };
  }
  revalidate(projectId, scenarioId);
  return { success: true };
}
