"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { landCostSchema } from "@/lib/validations/land-cost";
import {
  createLandCost,
  updateLandCost,
  deleteLandCost,
} from "@/lib/db/land-costs";
import { assertScenarioAccess } from "@/lib/db/access";
import { getRequiredSession } from "@/lib/auth/session";

export type LandCostActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
} | null;

function parseFormData(formData: FormData) {
  const get = (key: string) => formData.get(key) || undefined;
  return {
    category: get("category"),
    name: get("name"),
    description: get("description"),
    area: get("area"),
    unitPrice: get("unitPrice"),
    totalAmount: get("totalAmount"),
    paymentMonth: get("paymentMonth"),
    notes: get("notes"),
  };
}

function revalidate(projectId: string, scenarioId: string) {
  revalidatePath(`/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-dat`);
}

function handleAccessError(err: unknown): LandCostActionState | null {
  const msg = err instanceof Error ? err.message : "";
  if (msg === "FORBIDDEN") {
    return { success: false, message: "Bạn không có quyền thực hiện hành động này." };
  }
  return null;
}

export async function createLandCostAction(
  scenarioId: string,
  projectId: string,
  _prev: LandCostActionState,
  formData: FormData
): Promise<LandCostActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const result = landCostSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await createLandCost(scenarioId, result.data);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }

  revalidate(projectId, scenarioId);
  redirect(`/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-dat`);
}

export async function updateLandCostAction(
  costId: string,
  scenarioId: string,
  projectId: string,
  _prev: LandCostActionState,
  formData: FormData
): Promise<LandCostActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const result = landCostSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await updateLandCost(costId, result.data);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }

  revalidate(projectId, scenarioId);
  redirect(`/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-dat`);
}

export async function deleteLandCostAction(
  costId: string,
  scenarioId: string,
  projectId: string
): Promise<{ success: boolean; message?: string }> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await deleteLandCost(costId);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra khi xóa mục chi phí." };
  }

  revalidate(projectId, scenarioId);
  return { success: true };
}
