import Link from "next/link";
import { Building2 } from "lucide-react";
import ProjectStatusBadge from "./ProjectStatusBadge";
import { PROJECT_TYPE_LABELS } from "@/lib/validations/project";

interface ProjectRow {
  id: string;
  code: string;
  name: string;
  type: string;
  province: string;
  status: string;
  createdAt: Date;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function ProjectTable({ projects }: { projects: ProjectRow[] }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <Building2 className="h-7 w-7 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-800">Chưa có dự án nào</h3>
        <p className="mt-1.5 max-w-sm text-sm text-gray-500">
          Tạo dự án đầu tiên để bắt đầu phân tích tài chính.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Mã dự án
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Tên dự án
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Loại dự án
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Tỉnh/Thành phố
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Ngày tạo
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {projects.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm font-mono font-medium text-gray-700">
                {p.code}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/du-an/${p.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {p.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {PROJECT_TYPE_LABELS[p.type] ?? p.type}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{p.province}</td>
              <td className="px-4 py-3">
                <ProjectStatusBadge status={p.status} />
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {formatDate(p.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/du-an/${p.id}`}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Chi tiết →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
