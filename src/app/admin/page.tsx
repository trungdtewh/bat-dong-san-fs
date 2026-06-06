import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { Users, Building2, GitBranch, UserCheck } from "lucide-react";
import { getRequiredAdminSession } from "@/lib/auth/session";
import { getAdminStats } from "@/lib/db/admin";

export const metadata: Metadata = {
  title: "Tổng quan | Admin | FS Dòng Tiền BĐS",
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold text-gray-900">
        {value.toLocaleString("vi-VN")}
      </p>
    </div>
  );
}

export default async function AdminPage() {
  await getRequiredAdminSession().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "UNAUTHORIZED") redirect("/dang-nhap");
    notFound();
  });

  const stats = await getAdminStats();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Tổng quan hệ thống</h1>
        <p className="mt-1 text-sm text-gray-500">
          Thống kê toàn bộ dữ liệu trên hệ thống
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Người dùng"
          value={stats.userCount}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          label="Dự án"
          value={stats.projectCount}
          icon={Building2}
          color="bg-emerald-500"
        />
        <StatCard
          label="Kịch bản"
          value={stats.scenarioCount}
          icon={GitBranch}
          color="bg-purple-500"
        />
        <StatCard
          label="Thành viên dự án"
          value={stats.memberCount}
          icon={UserCheck}
          color="bg-orange-500"
        />
      </div>
    </div>
  );
}
