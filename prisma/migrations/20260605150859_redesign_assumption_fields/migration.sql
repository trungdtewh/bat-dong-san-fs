/*
  Warnings:

  - You are about to drop the column `discountRate` on the `assumptions` table. All the data in the column will be lost.
  - You are about to drop the column `otherAssumptions` on the `assumptions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "assumptions" DROP COLUMN "discountRate",
DROP COLUMN "otherAssumptions",
ADD COLUMN     "constructionEscalationRate" DECIMAL(10,4),
ADD COLUMN     "debtRatio" DECIMAL(10,4),
ADD COLUMN     "equityRatio" DECIMAL(10,4),
ADD COLUMN     "gracePeriodMonths" INTEGER,
ADD COLUMN     "landPriceEscalationRate" DECIMAL(10,4),
ADD COLUMN     "landTransferTaxRate" DECIMAL(10,4),
ADD COLUMN     "loanInterestRate" DECIMAL(10,4),
ADD COLUMN     "loanTenorMonths" INTEGER,
ADD COLUMN     "marketingCostRate" DECIMAL(10,4),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "priceEscalationRate" DECIMAL(10,4);
