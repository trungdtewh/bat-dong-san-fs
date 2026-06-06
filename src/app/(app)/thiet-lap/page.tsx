import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Server } from "lucide-react";
import { getRequiredSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/users";
import AccountInfoForm from "@/components/settings/AccountInfoForm";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";
import type { UserRole } from "@/generated/prisma/client";

export const metadata: Metadata = {
  title: "Thiết lập | FS Dòng Tiền BĐS",
};

function EnvRow({ label, present }: { label: string; present: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="font-mono text-sm text-gray-700">{label}</span>
      {present ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
          ✓ Đã cấu hình
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
          ✗ Thiếu
        </span>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default async function ThietLapPage() {
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const user = await getUserById(session.user.id);
  if (!user) redirect("/dang-nhap");

  const nodeEnv = process.env.NODE_ENV ?? "development";
  const serverTime = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "medium",
    timeStyle: "medium",
  });

  const envChecks = [
    { label: "DATABASE_URL", present: !!process.env.DATABASE_URL },
    { label: "NEXTAUTH_SECRET", present: !!process.env.NEXTAUTH_SECRET },
    { label: "NEXTAUTH_URL", present: !!process.env.NEXTAUTH_URL },
    { label: "NODE_ENV", present: !!process.env.NODE_ENV },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Thiết lập</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý thông tin tài khoản và cấu hình hệ thống
        </p>
      </div>

      <div className="space-y-6">
        {/* Thông tin tài khoản */}
        <AccountInfoForm
          name={user.name}
          email={user.email}
          role={user.role as UserRole}
        />

        {/* Đổi mật khẩu */}
        <ChangePasswordForm />

        {/* Thông tin hệ thống */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <Server className="h-4 w-4 text-gray-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Thông tin hệ thống</h2>
          </div>

          <div className="px-6 py-2">
            <div className="divide-y divide-gray-100">
              <InfoRow label="Phiên bản" value="0.1.0" />
              <InfoRow label="Môi trường" value={nodeEnv} />
              <InfoRow label="Cơ sở dữ liệu" value="PostgreSQL" />
              <InfoRow label="Thời gian máy chủ" value={serverTime} />
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Biến môi trường
              </p>
              <div className="divide-y divide-gray-50">
                {envChecks.map((e) => (
                  <EnvRow key={e.label} label={e.label} present={e.present} />
                ))}
              </div>
            </div>

            <p className="pb-4 pt-4 text-xs text-gray-400">
              FS Dòng Tiền BĐS — Phần mềm lập kế hoạch tài chính bất động sản
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
