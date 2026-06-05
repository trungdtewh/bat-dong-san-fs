import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import ProjectForm from "@/components/projects/ProjectForm";
import { createProjectAction } from "@/app/(app)/du-an/actions";

export const metadata: Metadata = {
  title: "Tạo dự án | FS Dòng Tiền BĐS",
};

export default function TaoMoiPage() {
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
        <h1 className="text-2xl font-semibold text-gray-900">Tạo dự án mới</h1>
        <p className="mt-1 text-sm text-gray-500">
          Điền thông tin để tạo dự án bất động sản mới
        </p>
      </div>

      <ProjectForm
        action={createProjectAction}
        cancelHref="/du-an"
        submitLabel="Tạo dự án"
      />
    </div>
  );
}
