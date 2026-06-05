import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, GitBranch, Pencil, Plus, Star } from "lucide-react";
import type { Metadata } from "next";
import { getProjectById } from "@/lib/db/projects";
import { listScenariosByProject } from "@/lib/db/scenarios";
import ProjectStatusBadge from "@/components/projects/ProjectStatusBadge";
import DeleteProjectButton from "@/components/projects/DeleteProjectButton";
import ScenarioTypeBadge from "@/components/scenarios/ScenarioTypeBadge";
import { PROJECT_TYPE_LABELS } from "@/lib/validations/project";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id);
  return {
    title: project ? `${project.name} | FS Dòng Tiền BĐS` : "Dự án | FS Dòng Tiền BĐS",
  };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatArea(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("vi-VN").format(value) + " m²";
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export default async function ChiTietDuAnPage({ params }: Props) {
  const { id } = await params;
  const [project, scenarios] = await Promise.all([
    getProjectById(id),
    listScenariosByProject(id),
  ]);

  if (!project) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/du-an"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="mt-1 font-mono text-sm text-gray-500">{project.code}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/du-an/${project.id}/sua`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Pencil className="h-4 w-4" />
              Chỉnh sửa
            </Link>
            <DeleteProjectButton id={project.id} projectName={project.name} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Thông tin cơ bản */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Thông tin cơ bản</h2>
          <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            <InfoRow label="Mã dự án" value={<span className="font-mono">{project.code}</span>} />
            <InfoRow label="Tên dự án" value={project.name} />
            <InfoRow label="Loại dự án" value={PROJECT_TYPE_LABELS[project.type] ?? project.type} />
            <InfoRow label="Tỉnh/Thành phố" value={project.province} />
            <InfoRow label="Trạng thái" value={<ProjectStatusBadge status={project.status} />} />
          </dl>
        </div>

        {/* Thông tin diện tích */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Thông tin diện tích</h2>
          <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            <InfoRow label="Diện tích đất" value={formatArea(project.totalArea)} />
            <InfoRow label="Tổng diện tích sàn" value={formatArea(project.grossFloorArea)} />
            <InfoRow label="Tổng diện tích kinh doanh" value={formatArea(project.commercialArea)} />
          </dl>
        </div>

        {/* Thông tin hệ thống */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Thông tin hệ thống</h2>
          <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            <InfoRow label="Ngày tạo" value={formatDate(project.createdAt)} />
            <InfoRow label="Cập nhật lần cuối" value={formatDate(project.updatedAt)} />
          </dl>
        </div>

        {/* Kịch bản */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Kịch bản ({scenarios.length})
            </h2>
            <Link
              href={`/du-an/${id}/kich-ban`}
              className="text-sm text-blue-600 hover:underline"
            >
              Quản lý kịch bản →
            </Link>
          </div>

          {scenarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-8 text-center">
              <GitBranch className="mb-2 h-6 w-6 text-gray-300" />
              <p className="text-sm text-gray-400">Chưa có kịch bản nào.</p>
              <Link
                href={`/du-an/${id}/kich-ban/tao-moi`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Tạo kịch bản đầu tiên
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {scenarios.slice(0, 5).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <ScenarioTypeBadge type={s.type} />
                  <Link
                    href={`/du-an/${id}/kich-ban/${s.id}`}
                    className="flex-1 text-sm font-medium text-blue-600 hover:underline"
                  >
                    {s.name}
                  </Link>
                  {s.isBase && (
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  )}
                </li>
              ))}
              {scenarios.length > 5 && (
                <li className="px-3 pt-1">
                  <Link
                    href={`/du-an/${id}/kich-ban`}
                    className="text-sm text-gray-500 hover:text-blue-600"
                  >
                    Xem thêm {scenarios.length - 5} kịch bản khác →
                  </Link>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
