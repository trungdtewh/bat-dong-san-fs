-- Drop old unique constraint
ALTER TABLE "cash_flow_entries" DROP CONSTRAINT IF EXISTS "cash_flow_entries_scenarioId_year_month_key";

-- Drop old columns
ALTER TABLE "cash_flow_entries" DROP COLUMN IF EXISTS "year";
ALTER TABLE "cash_flow_entries" DROP COLUMN IF EXISTS "month";
ALTER TABLE "cash_flow_entries" DROP COLUMN IF EXISTS "period";

-- Add projectMonth
ALTER TABLE "cash_flow_entries" ADD COLUMN "projectMonth" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "cash_flow_entries" ALTER COLUMN "projectMonth" DROP DEFAULT;

-- Add totalInflow, totalOutflow
ALTER TABLE "cash_flow_entries" ADD COLUMN "totalInflow" DECIMAL(20,0) NOT NULL DEFAULT 0;
ALTER TABLE "cash_flow_entries" ADD COLUMN "totalOutflow" DECIMAL(20,0) NOT NULL DEFAULT 0;

-- New unique constraint
ALTER TABLE "cash_flow_entries" ADD CONSTRAINT "cash_flow_entries_scenarioId_projectMonth_key" UNIQUE ("scenarioId", "projectMonth");
