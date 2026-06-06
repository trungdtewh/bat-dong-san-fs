"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { projectSchema } from "@/lib/validations/project";
import {
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/db/projects";
import { assertProjectAccess } from "@/lib/db/access";
import { getRequiredSession } from "@/lib/auth/session";

export type ActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
} | null;

function parseFormData(formData: FormData) {
  return {
    code: formData.get("code"),
    name: formData.get("name"),
    type: formData.get("type"),
    province: formData.get("province"),
    status: formData.get("status"),
    totalArea: formData.get("totalArea"),
    grossFloorArea: formData.get("grossFloorArea"),
    commercialArea: formData.get("commercialArea"),
  };
}

function handleDbError(err: unknown): ActionState {
  const msg = err instanceof Error ? err.message : "";
  if (msg === "FORBIDDEN") {
    return { success: false, message: "Bạn không có quyền thực hiện hành động này." };
  }
  if (msg.toLowerCase().includes("unique") || msg.includes("code")) {
    return { success: false, errors: { code: ["Mã dự án đã tồn tại"] } };
  }
  return { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
}

export async function createProjectAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const result = projectSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  try {
    await createProject(result.data, session.user.id);
  } catch (err) {
    return handleDbError(err);
  }

  revalidatePath("/du-an");
  redirect("/du-an");
}

export async function updateProjectAction(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const result = projectSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  try {
    await assertProjectAccess(session.user.id, id, "EDITOR");
    await updateProject(id, result.data);
  } catch (err) {
    return handleDbError(err);
  }

  revalidatePath("/du-an");
  revalidatePath(`/du-an/${id}`);
  redirect(`/du-an/${id}`);
}

export async function deleteProjectAction(id: string): Promise<ActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  try {
    await assertProjectAccess(session.user.id, id, "OWNER");
    await deleteProject(id);
  } catch (err) {
    return handleDbError(err);
  }
  revalidatePath("/du-an");
  redirect("/du-an");
}
