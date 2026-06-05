-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProjectStatus" ADD VALUE 'SELLING';
ALTER TYPE "ProjectStatus" ADD VALUE 'HANDED_OVER';

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_createdById_fkey";

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "commercialArea" DOUBLE PRECISION,
ADD COLUMN     "grossFloorArea" DOUBLE PRECISION,
ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "createdById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
