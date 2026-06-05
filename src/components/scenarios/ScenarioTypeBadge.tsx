const styles: Record<string, string> = {
  BASE: "bg-blue-100 text-blue-800",
  OPTIMISTIC: "bg-green-100 text-green-800",
  PESSIMISTIC: "bg-red-100 text-red-800",
  CUSTOM: "bg-purple-100 text-purple-800",
};

const labels: Record<string, string> = {
  BASE: "Cơ sở",
  OPTIMISTIC: "Lạc quan",
  PESSIMISTIC: "Bi quan",
  CUSTOM: "Tùy chỉnh",
};

export default function ScenarioTypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[type] ?? "bg-gray-100 text-gray-700"}`}
    >
      {labels[type] ?? type}
    </span>
  );
}
