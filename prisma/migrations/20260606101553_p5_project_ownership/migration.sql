/*
  P5 Ownership Validation
  - Backfill createdById for projects with NULL value (assign to admin user)
  - Set createdById NOT NULL
  - Create OWNER ProjectMember for existing projects that have none
*/

-- Step 1: Backfill NULL createdById with admin user
UPDATE "projects"
SET "createdById" = (
  SELECT id FROM "users"
  WHERE role = 'ADMIN'
  ORDER BY "createdAt" ASC
  LIMIT 1
)
WHERE "createdById" IS NULL;

-- Step 2: Drop old nullable FK
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_createdById_fkey";

-- Step 3: Set NOT NULL
ALTER TABLE "projects" ALTER COLUMN "createdById" SET NOT NULL;

-- Step 4: Recreate FK as required
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 5: Create OWNER ProjectMember for existing projects that have none
INSERT INTO "project_members" ("id", "projectId", "userId", "role", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  p.id,
  p."createdById",
  'OWNER'::"ProjectRole",
  NOW(),
  NOW()
FROM "projects" p
WHERE NOT EXISTS (
  SELECT 1 FROM "project_members" pm
  WHERE pm."projectId" = p.id AND pm."userId" = p."createdById"
);
