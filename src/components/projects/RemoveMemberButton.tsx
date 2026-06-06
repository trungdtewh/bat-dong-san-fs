"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import type { ActionState } from "@/app/(app)/du-an/[id]/thanh-vien/actions";

interface Props {
  action: () => Promise<ActionState>;
  memberName: string;
  isSelf: boolean;
}

export default function RemoveMemberButton({ action, memberName, isSelf }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (isSelf) {
    return <span className="text-xs text-gray-300">—</span>;
  }

  const handleRemove = () => {
    startTransition(async () => {
      const result = await action();
      if (result && !result.success) {
        setError(result.message ?? "Có lỗi xảy ra.");
        setConfirming(false);
      }
    });
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
        title="Xóa thành viên"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
      {error && <p className="mb-2 text-xs text-red-700">{error}</p>}
      <p className="mb-2 text-xs font-medium text-red-800">
        Xóa <span className="font-semibold">{memberName}</span> khỏi dự án?
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? "Đang xóa..." : "Xóa"}
        </button>
        <button
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={isPending}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
