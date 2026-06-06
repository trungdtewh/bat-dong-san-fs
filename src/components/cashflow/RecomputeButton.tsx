"use client";

import { useActionState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { ActionResult } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/dong-tien/actions";

type BoundAction = (
  prevState: ActionResult | null,
  formData: FormData
) => Promise<ActionResult>;

export default function RecomputeButton({ action }: { action: BoundAction }) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
          {pending ? "Đang tính toán..." : "Tính toán lại"}
        </button>
      </form>
      {state && !state.success && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
    </div>
  );
}
