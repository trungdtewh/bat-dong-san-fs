import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <Icon className="h-7 w-7 text-gray-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-gray-500">{description}</p>
      )}
      <span className="mt-5 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
        Đang phát triển
      </span>
    </div>
  );
}
