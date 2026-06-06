import "dotenv/config";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";

function cuid(): string {
  return "c" + randomUUID().replace(/-/g, "").substring(0, 24);
}

function pool() {
  return new Pool({ connectionString: process.env.DATABASE_URL! });
}

export async function createTestProject(ownerEmail: string, codeSuffix: string) {
  const db = pool();

  const { rows: [owner] } = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [ownerEmail]
  );
  if (!owner) throw new Error(`Người dùng không tồn tại: ${ownerEmail}`);

  const projectId = cuid();
  const code = `E2E-${codeSuffix}`;
  const name = `[E2E] Dự án ${codeSuffix}`;

  await db.query(
    `INSERT INTO projects
       (id, code, name, type, status, "currencyCode", province, "totalArea", "createdById", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'CHUNG_CU'::"ProjectType", 'PLANNING'::"ProjectStatus",
             'VND', 'Hà Nội', 10000, $4, now(), now())`,
    [projectId, code, name, owner.id]
  );

  await db.query(
    `INSERT INTO project_members (id, "projectId", "userId", role, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'OWNER'::"ProjectRole", now(), now())`,
    [cuid(), projectId, owner.id]
  );

  await db.end();
  return { id: projectId, code, name };
}

export async function createTestScenario(projectId: string, name: string) {
  const db = pool();
  const scenarioId = cuid();
  const assumptionId = cuid();

  await db.query(
    `INSERT INTO scenarios
       (id, "projectId", name, type, "isBase", "isActive", version, "isSnapshot",
        "durationMonths", "constructionStartMonth", "salesStartMonth",
        "handoverStartMonth", "discountRate", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'BASE'::"ScenarioType", true, true, 1, false,
             24, 1, 6, 18, 0.12, now(), now())`,
    [scenarioId, projectId, name]
  );

  await db.query(
    `INSERT INTO assumptions
       (id, "scenarioId", "inflationRate", "corporateTaxRate", "vatRate",
        "salesCommissionRate", "contingencyRate", "createdAt", "updatedAt")
     VALUES ($1, $2, 0.03, 0.20, 0.10, 0.02, 0.05, now(), now())`,
    [assumptionId, scenarioId]
  );

  await db.end();
  return { id: scenarioId };
}

export async function addTestMember(
  projectId: string,
  email: string,
  role: string
) {
  const db = pool();

  const { rows: [user] } = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  if (!user) throw new Error(`Người dùng không tồn tại: ${email}`);

  await db.query(
    `INSERT INTO project_members (id, "projectId", "userId", role, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4::"ProjectRole", now(), now())
     ON CONFLICT ("projectId", "userId") DO UPDATE SET role = $4::"ProjectRole"`,
    [cuid(), projectId, user.id, role]
  );

  await db.end();
}

export async function cleanupProject(projectId: string) {
  const db = pool();
  await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
  await db.end();
}

export async function cleanupProjectsByCode(codePrefix: string) {
  const db = pool();
  await db.query("DELETE FROM projects WHERE code LIKE $1", [`${codePrefix}%`]);
  await db.end();
}
