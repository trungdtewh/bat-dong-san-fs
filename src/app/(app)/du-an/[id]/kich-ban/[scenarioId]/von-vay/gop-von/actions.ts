"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { equityContributionSchema } from "@/lib/validations/equity-contribution";
import { createEquity, updateEquity, deleteEquity } from "@/lib/db/equity-contributions";
import { assertScenarioAccess } from "@/lib/db/access";
import { getRequiredSession } from "@/lib/auth/session";

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

function handleError(err: unknown): EquityActionState {
  const msg = err instanceof Error ? err.message : "";
  if (msg === "FORBIDDEN") {
    return { success: false, message: "Bạn không có quyền thực hiện hành động này." };
  }
  return { success: false, message: msg || "Có lỗi xảy ra, vui lòng thử lại." };
}

export async function createEquityAction(
  scenarioId: string,
  projectId: string,
  _prev: EquityActionState,
  formData: FormData
): Promise<EquityActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const result = equityContributionSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }
  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await createEquity(scenarioId, result.data);
  } catch (err) {
    return handleError(err);
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
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const result = equityContributionSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }
  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await updateEquity(contributionId, result.data);
  } catch (err) {
    return handleError(err);
  }
  revalidate(projectId, scenarioId);
  redirect(`/du-an/${projectId}/kich-ban/${scenarioId}/von-vay`);
}

export async function deleteEquityAction(
  contributionId: string,
  scenarioId: string,
  projectId: string
): Promise<{ success: boolean; message?: string }> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await deleteEquity(contributionId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "FORBIDDEN") {
      return { success: false, message: "Bạn không có quyền thực hiện hành động này." };
    }
    return { success: false, message: "Có lỗi xảy ra khi xóa mục góp vốn." };
  }
  revalidate(projectId, scenarioId);
  return { success: true };
}
