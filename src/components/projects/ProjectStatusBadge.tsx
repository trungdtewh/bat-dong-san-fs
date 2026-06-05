import { PROJECT_STATUS_LABELS } from "@/lib/validations/project";

const STATUS_STYLES: Record<string, string> = {
  PLANNING: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  SELLING: "bg-green-50 text-green-700",
  HANDED_OVER: "bg-teal-50 text-teal-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  ON_HOLD: "bg-amber-50 text-amber-700",
  CANCELLED: "bg-red-50 text-red-600",
};

export default function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {PROJECT_STATUS_LABELS[status] ?? status}
    </span>
  );
}
