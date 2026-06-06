import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import AuthProvider from "@/components/auth/AuthProvider";
import AdminNav from "@/components/admin/AdminNav";
import { getRequiredAdminSession } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getRequiredAdminSession().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "UNAUTHORIZED") redirect("/dang-nhap");
    notFound();
  });

  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <aside className="flex h-full w-56 flex-shrink-0 flex-col bg-slate-900">
          <div className="flex h-16 flex-shrink-0 items-center border-b border-slate-800 px-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
                <span className="text-xs font-bold text-white">A</span>
              </div>
              <div>
                <p className="text-sm font-semibold leading-none text-white">Admin</p>
                <p className="mt-0.5 text-xs text-slate-400">Quản trị hệ thống</p>
              </div>
            </div>
          </div>
          <AdminNav />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
            <p className="text-sm text-gray-500">
              Đang đăng nhập:{" "}
              <span className="font-medium text-gray-900">{session.user.name}</span>
            </p>
            <Link
              href="/du-an"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← Về ứng dụng
            </Link>
          </header>
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
