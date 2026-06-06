import "dotenv/config";
import { Pool } from "pg";
import { TEST_USERS } from "./global-setup";

export default async function globalTeardown() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

  // Xóa dự án E2E (cascade tự động xóa toàn bộ dữ liệu liên quan)
  await pool.query("DELETE FROM projects WHERE code LIKE 'E2E-%'");

  // Xóa người dùng test
  const emails = TEST_USERS.map((u) => u.email);
  await pool.query("DELETE FROM users WHERE email = ANY($1::text[])", [emails]);

  await pool.end();
}
