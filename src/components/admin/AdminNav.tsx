"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Building2 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/admin/nguoi-dung", label: "Người dùng", icon: Users, exact: false },
  { href: "/admin/du-an", label: "Dự án", icon: Building2, exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col px-3 py-4">
      <div className="space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.label}</span>
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
