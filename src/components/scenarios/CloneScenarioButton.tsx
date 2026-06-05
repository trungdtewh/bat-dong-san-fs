"use client";

import { useState, useTransition } from "react";
import { Copy } from "lucide-react";
import { cloneScenarioAction } from "@/app/(app)/du-an/[id]/kich-ban/actions";

interface Props {
  id: string;
  projectId: string;
  scenarioName: string;
}

export default function CloneScenarioButton({ id, projectId, scenarioName }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClone = () => {
    startTransition(async () => {
      const result = await cloneScenarioAction(id, projectId);
      if (result && !result.success) {
        setError(result.message ?? "Có lỗi xảy ra khi nhân bản kịch bản.");
        setConfirming(false);
      }
    });
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Copy className="h-4 w-4" />
        Nhân bản
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      <p className="mb-3 text-sm font-medium text-gray-800">
        Nhân bản kịch bản{" "}
        <span className="font-semibold">&quot;{scenarioName}&quot;</span>?{" "}
        Bản sao sẽ được tạo với tên &quot;Sao chép — {scenarioName}&quot;.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleClone}
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? "Đang nhân bản..." : "Xác nhận"}
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
