import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById, getBaseScenario } from "@/lib/db/scenarios";
import ScenarioForm from "@/components/scenarios/ScenarioForm";
import { updateScenarioAction } from "@/app/(app)/du-an/[id]/kich-ban/actions";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";

interface Props {
  params: Promise<{ id: string; scenarioId: string }>;
}

export const metadata: Metadata = {
  title: "Chỉnh sửa kịch bản | FS Dòng Tiền BĐS",
};

export default async function SuaKichBanPage({ params }: Props) {
  const { id: projectId, scenarioId } = await params;
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const [scenario, baseScenario] = await Promise.all([
    getScenarioById(scenarioId),
    getBaseScenario(projectId),
  ]);

  if (!scenario || scenario.projectId !== projectId) notFound();
  await assertProjectAccess(session.user.id, projectId).catch(() => notFound());

  const otherBaseExists =
    !!baseScenario && baseScenario.id !== scenarioId;

  const boundAction = updateScenarioAction.bind(null, scenarioId, projectId);

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
        <h1 className="text-2xl font-semibold text-gray-900">
          Chỉnh sửa kịch bản
        </h1>
        <p className="mt-1 text-sm text-gray-500">{scenario.name}</p>
      </div>

      <ScenarioForm
        action={boundAction}
        initialData={{
          name: scenario.name,
          type: scenario.type,
          isBase: scenario.isBase,
          description: scenario.description,
          durationMonths: scenario.durationMonths,
          constructionStartMonth: scenario.constructionStartMonth,
          salesStartMonth: scenario.salesStartMonth,
          handoverStartMonth: scenario.handoverStartMonth,
          discountRate:
            scenario.discountRate != null
              ? parseFloat(scenario.discountRate.toString()) * 100
              : null,
        }}
        cancelHref={`/du-an/${projectId}/kich-ban/${scenarioId}`}
        submitLabel="Lưu thay đổi"
        disableIsBase={otherBaseExists}
      />
    </div>
  );
}
