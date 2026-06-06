import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginForm from "@/components/auth/LoginForm";

export default async function DangNhapPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/du-an");

  return <LoginForm />;
}
