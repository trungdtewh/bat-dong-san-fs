-- Drop old RevenueProduct table and related foreign key from PaymentSchedule
ALTER TABLE "payment_schedules" DROP COLUMN IF EXISTS "revenueProductId";
DROP TABLE IF EXISTS "revenue_products";

-- Drop old PriceUnit enum and recreate with new values
ALTER TYPE "PriceUnit" RENAME TO "PriceUnit_old";
CREATE TYPE "PriceUnit" AS ENUM ('PER_SQM', 'PER_UNIT');
DROP TYPE "PriceUnit_old";

-- Create RevenueProductType enum
CREATE TYPE "RevenueProductType" AS ENUM (
  'APARTMENT',
  'LAND_PLOT',
  'TOWNHOUSE',
  'SHOPHOUSE',
  'VILLA',
  'OFFICE',
  'RETAIL',
  'OTHER'
);

-- Create product_groups table
CREATE TABLE "product_groups" (
  "id"          TEXT NOT NULL,
  "scenarioId"  TEXT NOT NULL,
  "productCode" TEXT,
  "name"        TEXT NOT NULL,
  "productType" "RevenueProductType" NOT NULL DEFAULT 'APARTMENT',
  "totalUnits"  INTEGER NOT NULL,
  "area"        DOUBLE PRECISION,
  "basePrice"   DECIMAL(20,0) NOT NULL,
  "priceUnit"   "PriceUnit" NOT NULL DEFAULT 'PER_SQM',
  "vatRate"     DECIMAL(10,4) NOT NULL DEFAULT 0.1000,
  "notes"       TEXT,
  "sequence"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_groups_pkey" PRIMARY KEY ("id")
);

-- Create product_batches table
CREATE TABLE "product_batches" (
  "id"                  TEXT NOT NULL,
  "scenarioId"          TEXT NOT NULL,
  "groupId"             TEXT NOT NULL,
  "name"                TEXT NOT NULL,
  "launchMonth"         INTEGER NOT NULL,
  "unitsOffered"        INTEGER NOT NULL,
  "priceAdjustmentRate" DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
  "salesVelocity"       DECIMAL(10,4) NOT NULL,
  "collectionSchedule"  JSONB NOT NULL,
  "notes"               TEXT,
  "sequence"            INTEGER NOT NULL DEFAULT 0,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_batches_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "product_groups"
  ADD CONSTRAINT "product_groups_scenarioId_fkey"
  FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_batches"
  ADD CONSTRAINT "product_batches_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "product_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "product_groups_scenarioId_idx" ON "product_groups"("scenarioId");
CREATE INDEX "product_batches_scenarioId_idx" ON "product_batches"("scenarioId");
CREATE INDEX "product_batches_groupId_idx" ON "product_batches"("groupId");
