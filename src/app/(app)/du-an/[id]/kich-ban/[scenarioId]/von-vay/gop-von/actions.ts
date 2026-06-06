"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { equityContributionSchema } from "@/lib/validations/equity-contribution";
import { createEquity, updateEquity, deleteEquity } from "@/lib/db/equity-contributions";

export type EquityActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
} | null;

function parseFormData(formData: FormData) {
  const get = (key: string) => formData.get(key) || undefined;
  return {
    name: get("name"),
    contributorName: get("contributorName"),
    sourceType: get("sourceType"),
    totalAmount: get("totalAmount"),
    disbursementsJson: get("disbursementsJson"),
    notes: get("notes"),
  };
}

function revalidate(projectId: string, scenarioId: string) {
  revalidatePath(`/du-an/${projectId}/kich-ban/${scenarioId}/von-vay`);
}

export async function createEquityAction(
  scenarioId: string,
  projectId: string,
  _prev: EquityActionState,
  formData: FormData
): Promise<EquityActionState> {
  const result = equityContributionSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }
  try {
    await createEquity(scenarioId, result.data);
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại.",
    };
  }
  revalidate(projectId, scenarioId);
  redirect(`/du-an/${projectId}/kich-ban/${scenarioId}/von-vay`);
}

export async function updateEquityAction(
  contributionId: string,
  scenarioId: string,
  projectId: string,
  _prev: EquityActionState,
  formData: FormData
): Promise<EquityActionState> {
  const result = equityContributionSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }
  try {
    await updateEquity(contributionId, result.data);
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại.",
    };
  }
  revalidate(projectId, scenarioId);
  redirect(`/du-an/${projectId}/kich-ban/${scenarioId}/von-vay`);
}

export async function deleteEquityAction(
  contributionId: string,
  scenarioId: string,
  projectId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    await deleteEquity(contributionId);
  } catch {
    return { success: false, message: "Có lỗi xảy ra khi xóa mục góp vốn." };
  }
  revalidate(projectId, scenarioId);
  return { success: true };
}
