-- AlterTable
ALTER TABLE "cash_flow_entries" ALTER COLUMN "projectMonth" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerified" TIMESTAMP(3);
