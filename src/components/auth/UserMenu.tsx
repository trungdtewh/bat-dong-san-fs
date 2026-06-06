"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, UserCircle } from "lucide-react";

export default function UserMenu() {
  const { data: session } = useSession();

  if (!session) return null;

  const initials = session.user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      {/* Avatar + tên */}
      <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
          {initials || <UserCircle className="h-4 w-4" />}
        </div>
        <span className="hidden max-w-[120px] truncate text-sm text-gray-700 sm:inline">
          {session.user.name}
        </span>
      </div>

      {/* Nút đăng xuất */}
      <button
        onClick={() => signOut({ callbackUrl: "/dang-nhap" })}
        title="Đăng xuất"
        className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
