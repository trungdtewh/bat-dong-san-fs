"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { constructionPhaseSchema } from "@/lib/validations/construction-phase";
import { contractPackageSchema } from "@/lib/validations/contract-package";
import { constructionCostSchema } from "@/lib/validations/construction-cost";
import {
  createPhase,
  updatePhase,
  deletePhase,
} from "@/lib/db/construction-phases";
import {
  createPackage,
  updatePackage,
  deletePackage,
} from "@/lib/db/contract-packages";
import { createCost, updateCost, deleteCost } from "@/lib/db/construction-costs";
import { assertScenarioAccess } from "@/lib/db/access";
import { getRequiredSession } from "@/lib/auth/session";

export type ConstructionActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
} | null;

function revalidateAll(projectId: string, scenarioId: string) {
  revalidatePath(`/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-xay-dung`);
}

function handleAccessError(err: unknown): ConstructionActionState | null {
  const msg = err instanceof Error ? err.message : "";
  if (msg === "FORBIDDEN") {
    return { success: false, message: "Bạn không có quyền thực hiện hành động này." };
  }
  return null;
}

// ── GIAI ĐOẠN ────────────────────────────────────────────────────────────────

export async function createPhaseAction(
  scenarioId: string,
  projectId: string,
  _prev: ConstructionActionState,
  formData: FormData
): Promise<ConstructionActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const raw = {
    name: formData.get("name") || undefined,
    startMonth: formData.get("startMonth") || undefined,
    endMonth: formData.get("endMonth") || undefined,
    description: formData.get("description") || undefined,
  };
  const result = constructionPhaseSchema.safeParse(raw);
  if (!result.success)
    return { success: false, errors: result.error.flatten().fieldErrors };

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await createPhase(scenarioId, result.data);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }

  revalidateAll(projectId, scenarioId);
  redirect(`/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-xay-dung`);
}

export async function updatePhaseAction(
  phaseId: string,
  scenarioId: string,
  projectId: string,
  _prev: ConstructionActionState,
  formData: FormData
): Promise<ConstructionActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const raw = {
    name: formData.get("name") || undefined,
    startMonth: formData.get("startMonth") || undefined,
    endMonth: formData.get("endMonth") || undefined,
    description: formData.get("description") || undefined,
  };
  const result = constructionPhaseSchema.safeParse(raw);
  if (!result.success)
    return { success: false, errors: result.error.flatten().fieldErrors };

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await updatePhase(phaseId, result.data);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }

  revalidateAll(projectId, scenarioId);
  redirect(`/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-xay-dung`);
}

export async function deletePhaseAction(
  phaseId: string,
  scenarioId: string,
  projectId: string
): Promise<{ success: boolean; message?: string }> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await deletePhase(phaseId);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra khi xóa giai đoạn." };
  }
  revalidateAll(projectId, scenarioId);
  return { success: true };
}

// ── GÓI THẦU ─────────────────────────────────────────────────────────────────

export async function createPackageAction(
  phaseId: string,
  scenarioId: string,
  projectId: string,
  _prev: ConstructionActionState,
  formData: FormData
): Promise<ConstructionActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const raw = {
    name: formData.get("name") || undefined,
    contractorName: formData.get("contractorName") || undefined,
    contractValue: formData.get("contractValue") || undefined,
    startMonth: formData.get("startMonth") || undefined,
    endMonth: formData.get("endMonth") || undefined,
    distributionType: formData.get("distributionType") || undefined,
    customDistribution: formData.get("customDistribution") || undefined,
    notes: formData.get("notes") || undefined,
  };
  const result = contractPackageSchema.safeParse(raw);
  if (!result.success)
    return { success: false, errors: result.error.flatten().fieldErrors };

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await createPackage(scenarioId, phaseId, result.data);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }

  revalidateAll(projectId, scenarioId);
  redirect(
    `/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-xay-dung/${phaseId}`
  );
}

export async function updatePackageAction(
  packageId: string,
  phaseId: string,
  scenarioId: string,
  projectId: string,
  _prev: ConstructionActionState,
  formData: FormData
): Promise<ConstructionActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const raw = {
    name: formData.get("name") || undefined,
    contractorName: formData.get("contractorName") || undefined,
    contractValue: formData.get("contractValue") || undefined,
    startMonth: formData.get("startMonth") || undefined,
    endMonth: formData.get("endMonth") || undefined,
    distributionType: formData.get("distributionType") || undefined,
    customDistribution: formData.get("customDistribution") || undefined,
    notes: formData.get("notes") || undefined,
  };
  const result = contractPackageSchema.safeParse(raw);
  if (!result.success)
    return { success: false, errors: result.error.flatten().fieldErrors };

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await updatePackage(packageId, result.data);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }

  revalidateAll(projectId, scenarioId);
  redirect(
    `/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-xay-dung/${phaseId}`
  );
}

export async function deletePackageAction(
  packageId: string,
  phaseId: string,
  scenarioId: string,
  projectId: string
): Promise<{ success: boolean; message?: string }> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await deletePackage(packageId);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra khi xóa gói thầu." };
  }
  revalidateAll(projectId, scenarioId);
  return { success: true };
}

// ── HẠNG MỤC CHI PHÍ ─────────────────────────────────────────────────────────

export async function createCostAction(
  packageId: string,
  phaseId: string,
  scenarioId: string,
  projectId: string,
  _prev: ConstructionActionState,
  formData: FormData
): Promise<ConstructionActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const raw = {
    category: formData.get("category") || undefined,
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    unit: formData.get("unit") || undefined,
    quantity: formData.get("quantity") || undefined,
    unitPrice: formData.get("unitPrice") || undefined,
    totalAmount: formData.get("totalAmount") || undefined,
    inputMode: formData.get("inputMode") || undefined,
  };
  const result = constructionCostSchema.safeParse(raw);
  if (!result.success)
    return { success: false, errors: result.error.flatten().fieldErrors };

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await createCost(scenarioId, phaseId, packageId, result.data);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }

  revalidateAll(projectId, scenarioId);
  redirect(
    `/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-xay-dung/${phaseId}`
  );
}

export async function updateCostAction(
  costId: string,
  phaseId: string,
  scenarioId: string,
  projectId: string,
  _prev: ConstructionActionState,
  formData: FormData
): Promise<ConstructionActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const raw = {
    category: formData.get("category") || undefined,
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    unit: formData.get("unit") || undefined,
    quantity: formData.get("quantity") || undefined,
    unitPrice: formData.get("unitPrice") || undefined,
    totalAmount: formData.get("totalAmount") || undefined,
    inputMode: formData.get("inputMode") || undefined,
  };
  const result = constructionCostSchema.safeParse(raw);
  if (!result.success)
    return { success: false, errors: result.error.flatten().fieldErrors };

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await updateCost(costId, result.data);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }

  revalidateAll(projectId, scenarioId);
  redirect(
    `/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-xay-dung/${phaseId}`
  );
}

export async function deleteCostAction(
  costId: string,
  phaseId: string,
  scenarioId: string,
  projectId: string
): Promise<{ success: boolean; message?: string }> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  try {
    await assertScenarioAccess(session.user.id, scenarioId, "EDITOR");
    await deleteCost(costId);
  } catch (err) {
    return handleAccessError(err) ?? { success: false, message: "Có lỗi xảy ra khi xóa hạng mục." };
  }
  revalidateAll(projectId, scenarioId);
  return { success: true };
}
