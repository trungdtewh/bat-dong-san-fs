"use client";

import { useActionState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, User } from "lucide-react";
import { updateProfileAction } from "@/app/(app)/thiet-lap/actions";
import type { UserRole } from "@/generated/prisma/client";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Quản trị viên",
  MANAGER: "Quản lý",
  ANALYST: "Chuyên viên phân tích",
  VIEWER: "Chỉ xem",
};

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "bg-red-50 text-red-700 ring-red-600/20",
  MANAGER: "bg-blue-50 text-blue-700 ring-blue-600/20",
  ANALYST: "bg-violet-50 text-violet-700 ring-violet-600/20",
  VIEWER: "bg-gray-100 text-gray-600 ring-gray-500/20",
};

interface Props {
  name: string;
  email: string;
  role: UserRole;
}

export default function AccountInfoForm({ name, email, role }: Props) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [state, action, isPending] = useActionState(updateProfileAction, null);

  useEffect(() => {
    if (state?.success && state.message) {
      updateSession({ name: state.message }).then(() => router.refresh());
    }
  }, [state, updateSession, router]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
          <User className="h-4 w-4 text-blue-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Thông tin tài khoản</h2>
      </div>

      <div className="px-6 py-5">
        {/* Email + Role (chỉ đọc) */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Email</p>
            <p className="text-sm text-gray-900">{email}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Vai trò</p>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_COLORS[role]}`}
            >
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>

        {/* Form cập nhật tên */}
        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
              Họ tên
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={name}
              disabled={isPending}
              placeholder="Nhập họ tên"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:opacity-60 sm:max-w-sm"
            />
            {state?.errors?.name && (
              <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
            )}
          </div>

          {state?.success && (
            <p className="text-sm text-green-600">Đã cập nhật họ tên thành công.</p>
          )}
          {state && !state.success && state.message && (
            <p className="text-sm text-red-600">{state.message}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Lưu thay đổi
          </button>
        </form>
      </div>
    </div>
  );
}
