/*
  Warnings:

  - The `category` column on the `construction_costs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `endDate` on the `construction_phases` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `construction_phases` table. All the data in the column will be lost.
  - Added the required column `endMonth` to the `construction_phases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startMonth` to the `construction_phases` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ConstructionCostCategory" AS ENUM ('FOUNDATION', 'STRUCTURE', 'MEP', 'FINISHING', 'INFRASTRUCTURE', 'PROFESSIONAL_FEES', 'MANAGEMENT', 'CONTINGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "DistributionType" AS ENUM ('UNIFORM', 'S_CURVE', 'FRONT_LOADED', 'BACK_LOADED', 'MANUAL');

-- AlterTable
ALTER TABLE "construction_costs" ADD COLUMN     "packageId" TEXT,
ADD COLUMN     "sequence" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "category",
ADD COLUMN     "category" "ConstructionCostCategory" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "construction_phases" DROP COLUMN "endDate",
DROP COLUMN "startDate",
ADD COLUMN     "endMonth" INTEGER NOT NULL,
ADD COLUMN     "startMonth" INTEGER NOT NULL,
ALTER COLUMN "sequence" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "contract_packages" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractorName" TEXT,
    "contractValue" DECIMAL(20,0) NOT NULL,
    "startMonth" INTEGER NOT NULL,
    "endMonth" INTEGER NOT NULL,
    "distributionType" "DistributionType" NOT NULL DEFAULT 'UNIFORM',
    "customDistribution" JSONB,
    "notes" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_packages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_packages_scenarioId_idx" ON "contract_packages"("scenarioId");

-- CreateIndex
CREATE INDEX "contract_packages_phaseId_idx" ON "contract_packages"("phaseId");

-- CreateIndex
CREATE INDEX "construction_costs_packageId_idx" ON "construction_costs"("packageId");

-- AddForeignKey
ALTER TABLE "contract_packages" ADD CONSTRAINT "contract_packages_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_packages" ADD CONSTRAINT "contract_packages_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "construction_phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_costs" ADD CONSTRAINT "construction_costs_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "contract_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
