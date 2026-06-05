-- AlterTable
ALTER TABLE "scenarios" ADD COLUMN     "constructionStartMonth" INTEGER,
ADD COLUMN     "discountRate" DECIMAL(10,4),
ADD COLUMN     "durationMonths" INTEGER,
ADD COLUMN     "handoverStartMonth" INTEGER,
ADD COLUMN     "salesStartMonth" INTEGER;
