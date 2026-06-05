import Link from "next/link";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { listProjects } from "@/lib/db/projects";
import ProjectTable from "@/components/projects/ProjectTable";

export const metadata: Metadata = {
  title: "Dự án | FS Dòng Tiền BĐS",
};

export default async function DuAnPage() {
  const projects = await listProjects();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dự án</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý danh sách dự án bất động sản
          </p>
        </div>
        <Link
          href="/du-an/tao-moi"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Thêm dự án
        </Link>
      </div>

      <ProjectTable projects={projects} />
    </div>
  );
}
