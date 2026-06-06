"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loanSchema } from "@/lib/validations/loan";
import { createLoan, updateLoan, deleteLoan } from "@/lib/db/loans";

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

export async function createLoanAction(
  scenarioId: string,
  projectId: string,
  _prev: LoanActionState,
  formData: FormData
): Promise<LoanActionState> {
  const result = loanSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }
  try {
    await createLoan(scenarioId, result.data);
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại.",
    };
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
  const result = loanSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }
  try {
    await updateLoan(loanId, result.data);
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại.",
    };
  }
  revalidate(projectId, scenarioId);
  redirect(`/du-an/${projectId}/kich-ban/${scenarioId}/von-vay`);
}

export async function deleteLoanAction(
  loanId: string,
  scenarioId: string,
  projectId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    await deleteLoan(loanId);
  } catch {
    return { success: false, message: "Có lỗi xảy ra khi xóa khoản vay." };
  }
  revalidate(projectId, scenarioId);
  return { success: true };
}
