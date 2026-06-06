import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập | FS Dòng Tiền BĐS",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      {children}
    </div>
  );
}
