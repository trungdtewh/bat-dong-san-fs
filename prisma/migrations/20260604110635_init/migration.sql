-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'ANALYST', 'VIEWER');

-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('CHUNG_CU', 'DAT_NEN', 'NHA_PHO', 'SHOPHOUSE', 'BIET_THU', 'KHU_DO_THI', 'KHU_CONG_NGHIEP', 'MIXED_USE');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('LEGAL', 'DRAWING', 'PLANNING', 'PRICE_LIST', 'OTHER');

-- CreateEnum
CREATE TYPE "ScenarioType" AS ENUM ('BASE', 'OPTIMISTIC', 'PESSIMISTIC', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('LAND_CLEARANCE', 'CONSTRUCTION', 'INFRASTRUCTURE', 'PROFESSIONAL_FEES', 'MARKETING', 'MANAGEMENT', 'CONTINGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('BANK_LOAN', 'BOND', 'EQUITY_PARTNER', 'MEZZANINE', 'OTHER');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'REPAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PriceUnit" AS ENUM ('PER_M2', 'PER_UNIT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('LAND_PAYMENT', 'CONSTRUCTION_PAYMENT', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'REVENUE_COLLECTION', 'EQUITY_CONTRIBUTION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProjectType" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "currencyCode" TEXT NOT NULL DEFAULT 'VND',
    "province" TEXT NOT NULL,
    "district" TEXT,
    "address" TEXT,
    "totalArea" DOUBLE PRECISION NOT NULL,
    "buildableArea" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ProjectRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_documents" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ScenarioType" NOT NULL DEFAULT 'BASE',
    "description" TEXT,
    "isBase" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentScenarioId" TEXT,
    "isSnapshot" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assumptions" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "discountRate" DECIMAL(10,4) NOT NULL,
    "corporateTaxRate" DECIMAL(10,4) NOT NULL,
    "inflationRate" DECIMAL(10,4) NOT NULL,
    "vatRate" DECIMAL(10,4) NOT NULL,
    "salesCommissionRate" DECIMAL(10,4) NOT NULL,
    "contingencyRate" DECIMAL(10,4) NOT NULL,
    "otherAssumptions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "land_costs" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" DECIMAL(20,0) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construction_phases" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "construction_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construction_costs" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "phaseId" TEXT,
    "category" "CostCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "quantity" DOUBLE PRECISION,
    "unitPrice" DECIMAL(20,0),
    "totalAmount" DECIMAL(20,0) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "construction_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_products" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "totalUnits" INTEGER NOT NULL,
    "averageArea" DOUBLE PRECISION NOT NULL,
    "launchPrice" DECIMAL(20,0) NOT NULL,
    "priceUnit" "PriceUnit" NOT NULL,
    "customPriceNote" TEXT,
    "launchDate" TIMESTAMP(3) NOT NULL,
    "saleCompletionDate" TIMESTAMP(3) NOT NULL,
    "absorptionSchedule" JSONB NOT NULL,
    "collectionTerms" JSONB NOT NULL,
    "priceEscalation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lenderName" TEXT,
    "type" "LoanType" NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "principalAmount" DECIMAL(20,0) NOT NULL,
    "interestRate" DECIMAL(10,4) NOT NULL,
    "tenorMonths" INTEGER NOT NULL,
    "gracePeriodMonths" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "capitalizedInterest" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equity_contributions" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contributorName" TEXT,
    "totalAmount" DECIMAL(20,0) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equity_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_schedules" (
    "id" TEXT NOT NULL,
    "scheduleType" "ScheduleType" NOT NULL,
    "name" TEXT NOT NULL,
    "totalAmount" DECIMAL(20,0) NOT NULL,
    "landCostId" TEXT,
    "constructionCostId" TEXT,
    "loanDisbursementId" TEXT,
    "loanRepaymentId" TEXT,
    "revenueProductId" TEXT,
    "equityContributionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_milestones" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" DECIMAL(20,0) NOT NULL,
    "description" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_flow_entries" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "revenueCollection" DECIMAL(20,0) NOT NULL DEFAULT 0,
    "loanDisbursement" DECIMAL(20,0) NOT NULL DEFAULT 0,
    "equityInflow" DECIMAL(20,0) NOT NULL DEFAULT 0,
    "otherInflow" DECIMAL(20,0) NOT NULL DEFAULT 0,
    "landPayment" DECIMAL(20,0) NOT NULL DEFAULT 0,
    "constructionPayment" DECIMAL(20,0) NOT NULL DEFAULT 0,
    "loanRepayment" DECIMAL(20,0) NOT NULL DEFAULT 0,
    "interestPayment" DECIMAL(20,0) NOT NULL DEFAULT 0,
    "taxPayment" DECIMAL(20,0) NOT NULL DEFAULT 0,
    "otherOutflow" DECIMAL(20,0) NOT NULL DEFAULT 0,
    "netCashFlow" DECIMAL(20,0) NOT NULL DEFAULT 0,
    "cumulativeCashFlow" DECIMAL(20,0) NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_flow_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_snapshots" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "totalRevenue" DECIMAL(20,0),
    "totalCost" DECIMAL(20,0),
    "grossProfit" DECIMAL(20,0),
    "grossMargin" DECIMAL(10,4),
    "netProfit" DECIMAL(20,0),
    "netMargin" DECIMAL(10,4),
    "irr" DECIMAL(10,4),
    "npv" DECIMAL(20,0),
    "roi" DECIMAL(10,4),
    "paybackPeriodMonths" INTEGER,
    "peakFundingRequirement" DECIMAL(20,0),
    "peakFundingMonth" INTEGER,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_projectId_userId_key" ON "project_members"("projectId", "userId");

-- CreateIndex
CREATE INDEX "project_documents_projectId_idx" ON "project_documents"("projectId");

-- CreateIndex
CREATE INDEX "project_documents_uploadedById_idx" ON "project_documents"("uploadedById");

-- CreateIndex
CREATE INDEX "scenarios_projectId_idx" ON "scenarios"("projectId");

-- CreateIndex
CREATE INDEX "scenarios_parentScenarioId_idx" ON "scenarios"("parentScenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "assumptions_scenarioId_key" ON "assumptions"("scenarioId");

-- CreateIndex
CREATE INDEX "land_costs_scenarioId_idx" ON "land_costs"("scenarioId");

-- CreateIndex
CREATE INDEX "construction_phases_scenarioId_idx" ON "construction_phases"("scenarioId");

-- CreateIndex
CREATE INDEX "construction_costs_scenarioId_idx" ON "construction_costs"("scenarioId");

-- CreateIndex
CREATE INDEX "construction_costs_phaseId_idx" ON "construction_costs"("phaseId");

-- CreateIndex
CREATE INDEX "revenue_products_scenarioId_idx" ON "revenue_products"("scenarioId");

-- CreateIndex
CREATE INDEX "loans_scenarioId_idx" ON "loans"("scenarioId");

-- CreateIndex
CREATE INDEX "equity_contributions_scenarioId_idx" ON "equity_contributions"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_schedules_landCostId_key" ON "payment_schedules"("landCostId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_schedules_constructionCostId_key" ON "payment_schedules"("constructionCostId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_schedules_loanDisbursementId_key" ON "payment_schedules"("loanDisbursementId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_schedules_loanRepaymentId_key" ON "payment_schedules"("loanRepaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_schedules_revenueProductId_key" ON "payment_schedules"("revenueProductId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_schedules_equityContributionId_key" ON "payment_schedules"("equityContributionId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_milestones_scheduleId_sequence_key" ON "payment_milestones"("scheduleId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "cash_flow_entries_scenarioId_year_month_key" ON "cash_flow_entries"("scenarioId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_snapshots_scenarioId_key" ON "kpi_snapshots"("scenarioId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_parentScenarioId_fkey" FOREIGN KEY ("parentScenarioId") REFERENCES "scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assumptions" ADD CONSTRAINT "assumptions_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_costs" ADD CONSTRAINT "land_costs_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_phases" ADD CONSTRAINT "construction_phases_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_costs" ADD CONSTRAINT "construction_costs_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_costs" ADD CONSTRAINT "construction_costs_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "construction_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_products" ADD CONSTRAINT "revenue_products_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equity_contributions" ADD CONSTRAINT "equity_contributions_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_landCostId_fkey" FOREIGN KEY ("landCostId") REFERENCES "land_costs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_constructionCostId_fkey" FOREIGN KEY ("constructionCostId") REFERENCES "construction_costs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_loanDisbursementId_fkey" FOREIGN KEY ("loanDisbursementId") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_loanRepaymentId_fkey" FOREIGN KEY ("loanRepaymentId") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_revenueProductId_fkey" FOREIGN KEY ("revenueProductId") REFERENCES "revenue_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_equityContributionId_fkey" FOREIGN KEY ("equityContributionId") REFERENCES "equity_contributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_milestones" ADD CONSTRAINT "payment_milestones_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "payment_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow_entries" ADD CONSTRAINT "cash_flow_entries_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_snapshots" ADD CONSTRAINT "kpi_snapshots_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
