import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

type AuthSession = Session & {
  user: { id: string; name: string; email: string; role: string };
};

export async function getRequiredSession(): Promise<AuthSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  return session as AuthSession;
}

export async function getRequiredAdminSession(): Promise<AuthSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  if (session.user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return session as AuthSession;
}
