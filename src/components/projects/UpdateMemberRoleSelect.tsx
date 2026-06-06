"use client";

import { useActionState } from "react";
import { PROJECT_ROLE_LABELS } from "@/lib/validations/project-member";
import type { ActionState } from "@/app/(app)/du-an/[id]/thanh-vien/actions";

interface Props {
  currentRole: string;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}

export default function UpdateMemberRoleSelect({ currentRole, action }: Props) {
  const [, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <select
        name="role"
        defaultValue={currentRole}
        disabled={isPending}
        className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
      >
        {Object.entries(PROJECT_ROLE_LABELS).map(([value, label]) => (
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
  );
}
