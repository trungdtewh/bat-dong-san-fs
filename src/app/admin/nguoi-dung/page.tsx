import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { Users } from "lucide-react";
import { getRequiredAdminSession } from "@/lib/auth/session";
import { listAllUsers } from "@/lib/db/admin";
import ChangeRoleSelect, { USER_ROLE_LABELS } from "@/components/admin/ChangeRoleSelect";
import { changeUserRoleAction } from "./actions";

export const metadata: Metadata = {
  title: "Người dùng | Admin | FS Dòng Tiền BĐS",
};

const ROLE_BADGE_CLASS: Record<string, string> = {
  ADMIN: "bg-red-50 text-red-700 border-red-200",
  MANAGER: "bg-purple-50 text-purple-700 border-purple-200",
  ANALYST: "bg-blue-50 text-blue-700 border-blue-200",
  VIEWER: "bg-gray-50 text-gray-600 border-gray-200",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default async function NguoiDungPage() {
  const session = await getRequiredAdminSession().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "UNAUTHORIZED") redirect("/dang-nhap");
    notFound();
  });

  const users = await listAllUsers();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Người dùng</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý tất cả người dùng trong hệ thống ({users.length})
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Vai trò hệ thống
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Ngày tạo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => {
                const isSelf = user.id === session.user.id;
                const boundAction = changeUserRoleAction.bind(null, user.id);

                return (
                  <tr key={user.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                          <span className="text-xs font-medium text-gray-600">
                            {user.name[0]?.toUpperCase() ?? "?"}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {user.name}
                          {isSelf && (
                            <span className="ml-1.5 text-xs font-normal text-gray-400">
                              (bạn)
                            </span>
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      {isSelf ? (
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            ROLE_BADGE_CLASS[user.role] ?? ROLE_BADGE_CLASS.VIEWER
                          }`}
                        >
                          {USER_ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      ) : (
                        <ChangeRoleSelect currentRole={user.role} action={boundAction} />
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(user.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="py-12 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-gray-200" />
              <p className="text-sm text-gray-400">Chưa có người dùng nào.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
