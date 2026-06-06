import "dotenv/config";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

export const TEST_USERS = [
  {
    email: "e2e-admin@fs-test.local",
    name: "Admin E2E",
    password: "E2eAdmin@123",
    role: "ADMIN",
    authFile: ".auth/admin.json",
  },
  {
    email: "e2e-owner@fs-test.local",
    name: "Owner E2E",
    password: "E2eOwner@123",
    role: "MANAGER",
    authFile: ".auth/owner.json",
  },
  {
    email: "e2e-editor@fs-test.local",
    name: "Editor E2E",
    password: "E2eEditor@123",
    role: "ANALYST",
    authFile: ".auth/editor.json",
  },
  {
    email: "e2e-viewer@fs-test.local",
    name: "Viewer E2E",
    password: "E2eViewer@123",
    role: "VIEWER",
    authFile: ".auth/viewer.json",
  },
];

function cuid(): string {
  return "c" + randomUUID().replace(/-/g, "").substring(0, 24);
}

export default async function globalSetup() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

  for (const u of TEST_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (id, email, name, "passwordHash", role, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5::\"UserRole\", true, now(), now())
       ON CONFLICT (email) DO UPDATE
         SET "passwordHash" = $4, "isActive" = true, "updatedAt" = now()`,
      [cuid(), u.email, u.name, passwordHash, u.role]
    );
  }

  await pool.end();
}
