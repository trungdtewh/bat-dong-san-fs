"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Banknote,
  BarChart3,
  Building2,
  GitBranch,
  Hammer,
  LayoutDashboard,
  MapPin,
  Settings,
  TrendingUp,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { label: "Tổng quan", href: "/tong-quan", icon: LayoutDashboard },
      { label: "Dự án", href: "/du-an", icon: Building2 },
    ],
  },
  {
    label: "Phân tích",
    items: [
      { label: "Kịch bản", href: "/kich-ban", icon: GitBranch },
      { label: "Chi phí đất", href: "/chi-phi-dat", icon: MapPin },
      { label: "Chi phí xây dựng", href: "/chi-phi-xay-dung", icon: Hammer },
      { label: "Doanh thu", href: "/doanh-thu", icon: TrendingUp },
      { label: "Vốn vay", href: "/von-vay", icon: Banknote },
      { label: "Dòng tiền", href: "/dong-tien", icon: Activity },
    ],
  },
  {
    label: "Xuất dữ liệu",
    items: [
      { label: "Báo cáo", href: "/bao-cao", icon: BarChart3 },
    ],
  },
];

const bottomItems: NavItem[] = [
  { label: "Thiết lập", href: "/thiet-lap", icon: Settings },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={[
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-slate-700 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white",
      ].join(" ")}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {isActive && (
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
      )}
    </Link>
  );
}

export default function SidebarNav() {
  return (
    <nav className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-4">
      <div className="space-y-5">
        {navGroups.map((group, index) => (
          <div key={index}>
            {group.label && (
              <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-slate-800 pt-4 space-y-0.5">
        {bottomItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>
    </nav>
  );
}
