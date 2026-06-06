"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getRequiredAdminSession } from "@/lib/auth/session";
import { updateUserRole } from "@/lib/db/admin";

export type ActionState = {
  success: boolean;
  message?: string;
} | null;

const changeRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "ANALYST", "VIEWER"]),
});

export async function changeUserRoleAction(
  userId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getRequiredAdminSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  if (userId === session.user.id) {
    return { success: false, message: "Không thể thay đổi vai trò của chính mình." };
  }

  const result = changeRoleSchema.safeParse({ role: formData.get("role") });
  if (!result.success) {
    return { success: false, message: "Vai trò không hợp lệ." };
  }

  try {
    await updateUserRole(userId, result.data.role);
  } catch {
    return { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }

  revalidatePath("/admin/nguoi-dung");
  return { success: true, message: "Đã cập nhật vai trò thành công." };
}
