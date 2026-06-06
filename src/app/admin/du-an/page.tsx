import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { getRequiredAdminSession } from "@/lib/auth/session";
import { listAllProjects } from "@/lib/db/admin";

export const metadata: Metadata = {
  title: "Dự án | Admin | FS Dòng Tiền BĐS",
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  CHUNG_CU: "Chung cư",
  DAT_NEN: "Đất nền",
  NHA_PHO: "Nhà phố",
  SHOPHOUSE: "Shophouse",
  BIET_THU: "Biệt thự",
  KHU_DO_THI: "Khu đô thị",
  KHU_CONG_NGHIEP: "Khu công nghiệp",
  MIXED_USE: "Mixed-use",
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNING: "Lập kế hoạch",
  IN_PROGRESS: "Đang triển khai",
  SELLING: "Đang bán",
  HANDED_OVER: "Bàn giao",
  COMPLETED: "Hoàn thành",
  ON_HOLD: "Tạm dừng",
  CANCELLED: "Đã hủy",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default async function DuAnAdminPage() {
  await getRequiredAdminSession().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "UNAUTHORIZED") redirect("/dang-nhap");
    notFound();
  });

  const projects = await listAllProjects();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dự án</h1>
        <p className="mt-1 text-sm text-gray-500">
          Toàn bộ dự án trong hệ thống ({projects.length})
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Dự án
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Chủ dự án
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Thành viên
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Kịch bản
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Ngày tạo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/du-an/${project.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {project.name}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {project.code} ·{" "}
                      {PROJECT_TYPE_LABELS[project.type] ?? project.type}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">
                      {project.createdBy?.name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {project.createdBy?.email ?? ""}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-900">
                    {project._count.members}
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-900">
                    {project._count.scenarios}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(project.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {projects.length === 0 && (
            <div className="py-12 text-center">
              <Building2 className="mx-auto mb-3 h-8 w-8 text-gray-200" />
              <p className="text-sm text-gray-400">Chưa có dự án nào.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
