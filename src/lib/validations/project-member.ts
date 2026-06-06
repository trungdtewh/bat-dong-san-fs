import { z } from "zod";

export const PROJECT_ROLE_LABELS: Record<string, string> = {
  OWNER: "Quản trị",
  EDITOR: "Biên tập",
  VIEWER: "Xem",
};

export const addMemberSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  role: z.enum(["OWNER", "EDITOR", "VIEWER"], { error: "Vai trò không hợp lệ" }),
});

export const updateRoleSchema = z.object({
  role: z.enum(["OWNER", "EDITOR", "VIEWER"], { error: "Vai trò không hợp lệ" }),
});

export type AddMemberFormData = z.infer<typeof addMemberSchema>;
export type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;
