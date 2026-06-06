import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import EquityForm from "@/components/equity/EquityForm";
import { createEquityAction } from "../actions";

interface Props {
  params: Promise<{ id: string; scenarioId: string }>;
}

export const metadata: Metadata = {
  title: "Thêm góp vốn | FS Dòng Tiền BĐS",
};

export default async function TaoGopVonPage({ params }: Props) {
  const { id: projectId, scenarioId } = await params;
  const scenario = await getScenarioById(scenarioId);
  if (!scenario || scenario.projectId !== projectId) notFound();

  const baseHref = `/du-an/${projectId}/kich-ban/${scenarioId}/von-vay`;
  const action = createEquityAction.bind(null, scenarioId, projectId);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={baseHref}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại vốn vay
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Thêm góp vốn</h1>
        <p className="mt-1 text-sm text-gray-500">{scenario.name}</p>
      </div>

      <div className="max-w-3xl">
        <EquityForm action={action} cancelHref={baseHref} />
      </div>
    </div>
  );
}
