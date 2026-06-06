"use client";

import { useActionState } from "react";
import { PROJECT_ROLE_LABELS } from "@/lib/validations/project-member";
import type { ActionState } from "@/app/(app)/du-an/[id]/thanh-vien/actions";

interface Props {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}

export default function AddMemberForm({ action }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-3">
      {state && !state.success && state.message && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}
      {state?.success && state.message && (
        <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <label htmlFor="member-email" className="mb-1 block text-xs font-medium text-gray-700">
            Email
          </label>
          <input
            id="member-email"
            name="email"
            type="email"
            placeholder="email@example.com"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {state?.errors?.email && (
            <p className="mt-1 text-xs text-red-600">{state.errors.email[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="member-role" className="mb-1 block text-xs font-medium text-gray-700">
            Vai trò
          </label>
          <select
            id="member-role"
            name="role"
            defaultValue="VIEWER"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {Object.entries(PROJECT_ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {state?.errors?.role && (
            <p className="mt-1 text-xs text-red-600">{state.errors.role[0]}</p>
          )}
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {isPending ? "Đang thêm..." : "Thêm thành viên"}
          </button>
        </div>
      </div>
    </form>
  );
}
