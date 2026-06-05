"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deletePackageAction } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/chi-phi-xay-dung/actions";

interface Props {
  packageId: string;
  phaseId: string;
  scenarioId: string;
  projectId: string;
  packageName: string;
}

export default function DeletePackageButton({ packageId, phaseId, scenarioId, projectId, packageName }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePackageAction(packageId, phaseId, scenarioId, projectId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.message ?? "Có lỗi xảy ra.");
        setConfirming(false);
      }
    });
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Xóa
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-gray-700">
        Xóa gói thầu &ldquo;<span className="font-medium">{packageName}</span>&rdquo;?
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {isPending ? "Đang xóa..." : "Xác nhận"}
        </button>
        <button
          onClick={() => { setConfirming(false); setError(null); }}
          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
