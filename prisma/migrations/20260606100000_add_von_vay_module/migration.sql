-- Add RepaymentMethod enum
CREATE TYPE "RepaymentMethod" AS ENUM ('EQUAL_PRINCIPAL', 'ANNUITY', 'BULLET', 'CUSTOM');

-- Add EquitySourceType enum
CREATE TYPE "EquitySourceType" AS ENUM ('OWNER_EQUITY', 'JOINT_VENTURE', 'PREFERRED_EQUITY', 'STRATEGIC_INVESTOR', 'OTHER');

-- Modify loans: replace startDate with startMonth, add repaymentMethod
ALTER TABLE "loans" DROP COLUMN IF EXISTS "startDate";
ALTER TABLE "loans" ADD COLUMN "startMonth" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "loans" ADD COLUMN "repaymentMethod" "RepaymentMethod" NOT NULL DEFAULT 'EQUAL_PRINCIPAL';

-- Modify equity_contributions: add sourceType
ALTER TABLE "equity_contributions"
  ADD COLUMN "sourceType" "EquitySourceType" NOT NULL DEFAULT 'OWNER_EQUITY';

-- Modify payment_schedules: remove loanRepaymentId (repayment computed at runtime)
ALTER TABLE "payment_schedules" DROP COLUMN IF EXISTS "loanRepaymentId";

-- Modify payment_milestones: replace year + month with projectMonth
ALTER TABLE "payment_milestones" DROP COLUMN IF EXISTS "year";
ALTER TABLE "payment_milestones" DROP COLUMN IF EXISTS "month";
ALTER TABLE "payment_milestones" ADD COLUMN "projectMonth" INTEGER NOT NULL DEFAULT 1;
