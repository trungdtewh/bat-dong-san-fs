"use client";

import { useFormStatus } from "react-dom";
import { RefreshCw } from "lucide-react";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Đang tính toán..." : "Tính toán lại"}
    </button>
  );
}

export default function RecomputeButton({
  action,
}: {
  action: () => Promise<void>;
}) {
  return (
    <form action={action}>
      <SubmitBtn />
    </form>
  );
}
