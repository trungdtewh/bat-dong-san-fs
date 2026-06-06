"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { productGroupSchema } from "@/lib/validations/product-group";
import { productBatchSchema } from "@/lib/validations/product-batch";
import {
  createGroup,
  updateGroup,
  deleteGroup,
} from "@/lib/db/product-groups";
import {
  createBatch,
  updateBatch,
  deleteBatch,
} from "@/lib/db/product-batches";
import { assertScenarioAccess } from "@/lib/db/access";
import { getRequiredSession } from "@/lib/auth/session";

export type RevenueActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
} | null;

function revalidate(projectId: string, scenarioId: string) {
  revalidatePath(`/du-an/${projectId}/kich-ban/${scenarioId}/doanh-thu`);
}

function handleAccessError(err: unknown): RevenueActionState | null {
  const msg = err instanceof Error ? err.message : "";
  if (msg === "FORBIDDEN") {
    return { success: false, message: "Bạn không có quyền thực hiện hành động này." };
  }
  return null;
}

// ─── ProductGroup ─────────────────────────────────────────────────────────────

export async function createGroupAction(
  scenarioId: string,
  projectId: string,
  _prev: RevenueActionState,
  formData: FormData
): Promise<RevenueActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const vatPct = parseFloat(String(formData.get("vatRate") ?? "0"));
  const raw = {
    productCode: formData.get("productCode"),
    name: formData.get("name"),
    productType: formData.get("productType"),
    totalUnits: formData.get("totalUnits"),
    priceUnit: formData.get("priceUnit"),
    area: formData.get("area") || undefined,
    basePrice: formData.get("basePrice"),
    vatRate: isNaN(vatPct) ? 0 : vatPct / 100,
    notes: formData.get("notes") || undefined,
  };
  const result = productGroupSchema.safeParse(raw);
  if (!result.success)
    return { success: false, errors: result.error.flatten().fieldErrors };

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await createGroup(scenarioId, result.data);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }
  revalidate(projectId, scenarioId);
  redirect(`/du-an/${projectId}/kich-ban/${scenarioId}/doanh-thu`);
}

export async function updateGroupAction(
  groupId: string,
  scenarioId: string,
  projectId: string,
  _prev: RevenueActionState,
  formData: FormData
): Promise<RevenueActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const vatPct2 = parseFloat(String(formData.get("vatRate") ?? "0"));
  const raw = {
    productCode: formData.get("productCode"),
    name: formData.get("name"),
    productType: formData.get("productType"),
    totalUnits: formData.get("totalUnits"),
    priceUnit: formData.get("priceUnit"),
    area: formData.get("area") || undefined,
    basePrice: formData.get("basePrice"),
    vatRate: isNaN(vatPct2) ? 0 : vatPct2 / 100,
    notes: formData.get("notes") || undefined,
  };
  const result = productGroupSchema.safeParse(raw);
  if (!result.success)
    return { success: false, errors: result.error.flatten().fieldErrors };

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await updateGroup(groupId, result.data);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }
  revalidate(projectId, scenarioId);
  redirect(`/du-an/${projectId}/kich-ban/${scenarioId}/doanh-thu`);
}

export async function deleteGroupAction(
  groupId: string,
  scenarioId: string,
  projectId: string
): Promise<{ success: boolean; message?: string }> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await deleteGroup(groupId);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra khi xóa nhóm sản phẩm." };
  }
  revalidate(projectId, scenarioId);
  return { success: true };
}

// ─── ProductBatch ─────────────────────────────────────────────────────────────

export async function createBatchAction(
  groupId: string,
  scenarioId: string,
  projectId: string,
  _prev: RevenueActionState,
  formData: FormData
): Promise<RevenueActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const adjPct = parseFloat(String(formData.get("priceAdjustmentRate") ?? "0"));
  const raw = {
    name: formData.get("name"),
    launchMonth: formData.get("launchMonth"),
    unitsOffered: formData.get("unitsOffered"),
    priceAdjustmentRate: isNaN(adjPct) ? 0 : adjPct / 100,
    salesVelocity: formData.get("salesVelocity"),
    collectionScheduleJson: formData.get("collectionScheduleJson"),
    notes: formData.get("notes") || undefined,
  };
  const result = productBatchSchema.safeParse(raw);
  if (!result.success)
    return { success: false, errors: result.error.flatten().fieldErrors };

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await createBatch(groupId, scenarioId, result.data);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }
  revalidate(projectId, scenarioId);
  redirect(`/du-an/${projectId}/kich-ban/${scenarioId}/doanh-thu`);
}

export async function updateBatchAction(
  batchId: string,
  groupId: string,
  scenarioId: string,
  projectId: string,
  _prev: RevenueActionState,
  formData: FormData
): Promise<RevenueActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const adjPct2 = parseFloat(String(formData.get("priceAdjustmentRate") ?? "0"));
  const raw = {
    name: formData.get("name"),
    launchMonth: formData.get("launchMonth"),
    unitsOffered: formData.get("unitsOffered"),
    priceAdjustmentRate: isNaN(adjPct2) ? 0 : adjPct2 / 100,
    salesVelocity: formData.get("salesVelocity"),
    collectionScheduleJson: formData.get("collectionScheduleJson"),
    notes: formData.get("notes") || undefined,
  };
  const result = productBatchSchema.safeParse(raw);
  if (!result.success)
    return { success: false, errors: result.error.flatten().fieldErrors };

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await updateBatch(batchId, groupId, scenarioId, result.data);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }
  revalidate(projectId, scenarioId);
  redirect(`/du-an/${projectId}/kich-ban/${scenarioId}/doanh-thu`);
}

export async function deleteBatchAction(
  batchId: string,
  scenarioId: string,
  projectId: string
): Promise<{ success: boolean; message?: string }> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await deleteBatch(batchId);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra khi xóa đợt mở bán." };
  }
  revalidate(projectId, scenarioId);
  return { success: true };
}
