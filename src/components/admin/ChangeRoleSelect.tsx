"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/admin/nguoi-dung/actions";

export const USER_ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị viên",
  MANAGER: "Quản lý",
  ANALYST: "Phân tích viên",
  VIEWER: "Xem",
};

interface Props {
  currentRole: string;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}

export default function ChangeRoleSelect({ currentRole, action }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <div className="space-y-1">
      <form action={formAction} className="flex items-center gap-2">
        <select
          name="role"
          defaultValue={currentRole}
          disabled={isPending}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
        >
          {Object.entries(USER_ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60 transition-colors"
        >
          {isPending ? "..." : "Lưu"}
        </button>
      </form>
      {state && !state.success && (
        <p className="text-xs text-red-600">{state.message}</p>
      )}
      {state?.success && (
        <p className="text-xs text-green-600">{state.message}</p>
      )}
    </div>
  );
}
