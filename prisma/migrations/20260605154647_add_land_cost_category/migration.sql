/*
  Warnings:

  - Added the required column `paymentMonth` to the `land_costs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LandCostCategory" AS ENUM ('LAND_USE_FEE', 'LAND_LEASE_FEE', 'COMPENSATION', 'RELOCATION', 'SITE_PREPARATION', 'LEGAL_FEES', 'TAX_AND_FEES', 'OTHER');

-- AlterTable
ALTER TABLE "land_costs" ADD COLUMN     "area" DOUBLE PRECISION,
ADD COLUMN     "category" "LandCostCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "paymentMonth" INTEGER NOT NULL,
ADD COLUMN     "sequence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unitPrice" DECIMAL(20,0);
