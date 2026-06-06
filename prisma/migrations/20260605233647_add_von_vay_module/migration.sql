-- AlterTable
ALTER TABLE "loans" ALTER COLUMN "startMonth" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payment_milestones" ALTER COLUMN "projectMonth" DROP DEFAULT;

-- AlterTable
ALTER TABLE "product_batches" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "product_groups" ALTER COLUMN "updatedAt" DROP DEFAULT;
