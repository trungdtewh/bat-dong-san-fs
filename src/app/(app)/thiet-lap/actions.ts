"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { profileSchema, changePasswordSchema } from "@/lib/validations/settings";
import { getUserById, updateUserName, updateUserPassword } from "@/lib/db/users";
import { getRequiredSession } from "@/lib/auth/session";

export type SettingsActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
} | null;

export async function updateProfileAction(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const result = profileSchema.safeParse({ name: formData.get("name") });
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  try {
    await updateUserName(session.user.id, result.data.name);
  } catch {
    return { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }

  revalidatePath("/thiet-lap");
  return { success: true, message: result.data.name };
}

export async function changePasswordAction(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const raw = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const result = changePasswordSchema.safeParse(raw);
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  const user = await getUserById(session.user.id);
  if (!user) redirect("/dang-nhap");

  const currentValid = await bcrypt.compare(
    result.data.currentPassword,
    user.passwordHash
  );
  if (!currentValid) {
    return {
      success: false,
      errors: { currentPassword: ["Mật khẩu hiện tại không đúng"] },
    };
  }

  const newHash = await bcrypt.hash(result.data.newPassword, 12);
  try {
    await updateUserPassword(session.user.id, newHash);
  } catch {
    return { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }

  return { success: true, message: "Đổi mật khẩu thành công." };
}
