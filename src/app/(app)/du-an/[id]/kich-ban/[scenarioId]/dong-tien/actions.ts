"use server";

import { revalidatePath } from "next/cache";
import { computeAndSaveCashFlow } from "@/lib/db/cashflow";

export async function recomputeCashFlowAction(scenarioId: string, projectId: string) {
  await computeAndSaveCashFlow(scenarioId);
  revalidatePath(`/du-an/${projectId}/kich-ban/${scenarioId}/dong-tien`);
}
