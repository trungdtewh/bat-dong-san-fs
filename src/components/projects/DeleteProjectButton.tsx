"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteProjectAction } from "@/app/(app)/du-an/actions";

export default function DeleteProjectButton({
  id,
  projectName,
}: {
  id: string;
  projectName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProjectAction(id);
      if (result && !result.success) {
        setError(result.message ?? "Có lỗi xảy ra khi xóa dự án.");
        setConfirming(false);
      }
    });
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Xóa dự án
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      {error && (
        <p className="mb-3 text-sm text-red-700">{error}</p>
      )}
      <p className="mb-3 text-sm font-medium text-red-800">
        Xác nhận xóa dự án <span className="font-semibold">&quot;{projectName}&quot;</span>?
        Hành động này không thể hoàn tác.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? "Đang xóa..." : "Xác nhận xóa"}
        </button>
        <button
          onClick={() => { setConfirming(false); setError(null); }}
          disabled={isPending}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
