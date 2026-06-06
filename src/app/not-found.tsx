import Link from "next/link";
import { FileQuestion } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Không tìm thấy trang | FS Dòng Tiền BĐS",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <FileQuestion className="mx-auto h-12 w-12 text-gray-300" />
        <h1 className="mt-4 text-xl font-semibold text-gray-900">
          Không tìm thấy trang
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.
        </p>
        <Link
          href="/du-an"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Về trang dự án
        </Link>
      </div>
    </div>
  );
}
