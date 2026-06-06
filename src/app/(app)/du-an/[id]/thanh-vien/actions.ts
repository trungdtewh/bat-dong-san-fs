"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";
import {
  findUserByEmail,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
} from "@/lib/db/project-members";
import { addMemberSchema, updateRoleSchema } from "@/lib/validations/project-member";

export type ActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
} | null;

function handleError(err: unknown): ActionState {
  const msg = err instanceof Error ? err.message : "";
  if (msg === "FORBIDDEN") {
    return { success: false, message: "Bạn không có quyền thực hiện hành động này." };
  }
  if (msg.toLowerCase().includes("unique")) {
    return { success: false, message: "Người dùng này đã là thành viên của dự án." };
  }
  return { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
}

export async function addProjectMemberAction(
  projectId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const result = addMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  try {
    await assertProjectAccess(session.user.id, projectId, "OWNER");

    const user = await findUserByEmail(result.data.email);
    if (!user) {
      return {
        success: false,
        errors: { email: ["Không tìm thấy người dùng với email này."] },
      };
    }

    await addProjectMember(projectId, user.id, result.data.role);
  } catch (err) {
    return handleError(err);
  }

  revalidatePath(`/du-an/${projectId}/thanh-vien`);
  return { success: true, message: "Đã thêm thành viên thành công." };
}

export async function updateProjectMemberRoleAction(
  projectId: string,
  memberId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const result = updateRoleSchema.safeParse({ role: formData.get("role") });

  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  try {
    await assertProjectAccess(session.user.id, projectId, "OWNER");
    await updateProjectMemberRole(projectId, memberId, result.data.role);
  } catch (err) {
    return handleError(err);
  }

  revalidatePath(`/du-an/${projectId}/thanh-vien`);
  return { success: true };
}

export async function removeProjectMemberAction(
  projectId: string,
  memberId: string
): Promise<ActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  try {
    await assertProjectAccess(session.user.id, projectId, "OWNER");
    await removeProjectMember(projectId, memberId);
  } catch (err) {
    return handleError(err);
  }

  revalidatePath(`/du-an/${projectId}/thanh-vien`);
  return { success: true };
}
