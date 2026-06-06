import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(
    `Cấu hình môi trường không hợp lệ. Thiếu hoặc sai biến: ${missing}. Kiểm tra file .env`
  );
}

export const env = parsed.data;
