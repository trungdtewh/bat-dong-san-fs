"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { scenarioSchema } from "@/lib/validations/scenario";
import {
  createScenario,
  updateScenario,
  deleteScenario,
  cloneScenario,
} from "@/lib/db/scenarios";

export type ActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
} | null;

function parseFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    type: formData.get("type"),
    isBase: formData.get("isBase") === "true",
    description: formData.get("description") || undefined,
    durationMonths: formData.get("durationMonths") || undefined,
    constructionStartMonth: formData.get("constructionStartMonth") || undefined,
    salesStartMonth: formData.get("salesStartMonth") || undefined,
    handoverStartMonth: formData.get("handoverStartMonth") || undefined,
    discountRate: formData.get("discountRate") || undefined,
  };
}

function handleDbError(err: unknown): ActionState {
  const msg = err instanceof Error ? err.message : "";
  if (msg === "BASE_EXISTS") {
    return {
      success: false,
      message: "Dự án đã có kịch bản cơ sở. Mỗi dự án chỉ được có một kịch bản cơ sở.",
    };
  }
  return { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
}

export async function createScenarioAction(
  projectId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = scenarioSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  let scenario;
  try {
    scenario = await createScenario(projectId, result.data);
  } catch (err) {
    return handleDbError(err);
  }

  revalidatePath(`/du-an/${projectId}/kich-ban`);
  redirect(`/du-an/${projectId}/kich-ban/${scenario.id}`);
}

export async function updateScenarioAction(
  id: string,
  projectId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = scenarioSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  try {
    await updateScenario(id, result.data);
  } catch (err) {
    return handleDbError(err);
  }

  revalidatePath(`/du-an/${projectId}/kich-ban`);
  revalidatePath(`/du-an/${projectId}/kich-ban/${id}`);
  redirect(`/du-an/${projectId}/kich-ban/${id}`);
}

export async function deleteScenarioAction(
  id: string,
  projectId: string
): Promise<ActionState> {
  try {
    await deleteScenario(id);
  } catch {
    return { success: false, message: "Có lỗi xảy ra khi xóa kịch bản." };
  }
  revalidatePath(`/du-an/${projectId}/kich-ban`);
  redirect(`/du-an/${projectId}/kich-ban`);
}

export async function cloneScenarioAction(
  id: string,
  projectId: string
): Promise<ActionState> {
  let cloned;
  try {
    cloned = await cloneScenario(id);
  } catch {
    return { success: false, message: "Có lỗi xảy ra khi nhân bản kịch bản." };
  }
  revalidatePath(`/du-an/${projectId}/kich-ban`);
  redirect(`/du-an/${projectId}/kich-ban/${cloned.id}`);
}
