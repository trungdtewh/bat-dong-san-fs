import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Plus } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import { listLandCostsByScenario } from "@/lib/db/land-costs";
import LandCostTable from "@/components/land-costs/LandCostTable";

interface Props {
  params: Promise<{ id: string; scenarioId: string }>;
}

export const metadata: Metadata = {
  title: "Chi phí đất | FS Dòng Tiền BĐS",
};

export default async function ChiPhiDatPage({ params }: Props) {
  const { id: projectId, scenarioId } = await params;

  const [scenario, costs] = await Promise.all([
    getScenarioById(scenarioId),
    listLandCostsByScenario(scenarioId),
  ]);

  if (!scenario || scenario.projectId !== projectId) notFound();

  const createHref = `/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-dat/tao-moi`;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/du-an/${projectId}/kich-ban/${scenarioId}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại chi tiết kịch bản
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Chi phí đất</h1>
            <p className="mt-1 text-sm text-gray-500">{scenario.name}</p>
          </div>
          <Link
            href={createHref}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Thêm mục
          </Link>
        </div>
      </div>

      {costs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm font-medium text-gray-700">
            Chưa có mục chi phí đất nào
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Thêm các khoản chi phí đất cho kịch bản này.
          </p>
          <Link
            href={createHref}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Thêm mục chi phí đất
          </Link>
        </div>
      ) : (
        <LandCostTable
          costs={costs}
          projectId={projectId}
          scenarioId={scenarioId}
        />
      )}
    </div>
  );
}
