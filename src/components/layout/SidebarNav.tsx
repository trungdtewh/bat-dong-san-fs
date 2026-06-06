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

// ─── CONTEXT ─────────────────────────────────────────────────────────────────

interface Context {
  projectId: string | null;
  scenarioId: string | null;
}

// cuid IDs are lowercase alphanumeric and long; route slugs like "tao-moi"
// contain hyphens or are very short, so this distinguishes them reliably.
function isCuid(s: string): boolean {
  return /^[a-z0-9]{10,}$/.test(s);
}

function parseContext(pathname: string): Context {
  const m2 = pathname.match(/^\/du-an\/([^/?#]+)\/kich-ban\/([^/?#]+)/);
  if (m2 && isCuid(m2[1]) && isCuid(m2[2])) {
    return { projectId: m2[1], scenarioId: m2[2] };
  }
  const m1 = pathname.match(/^\/du-an\/([^/?#]+)/);
  if (m1 && isCuid(m1[1])) {
    return { projectId: m1[1], scenarioId: null };
  }
  return { projectId: null, scenarioId: null };
}

// ─── ACTIVE KEY ───────────────────────────────────────────────────────────────

const SCENARIO_MODULES = [
  "chi-phi-dat",
  "chi-phi-xay-dung",
  "doanh-thu",
  "von-vay",
  "dong-tien",
  "bao-cao",
] as const;

function getActiveKey(pathname: string, { projectId, scenarioId }: Context): string {
  // ── Scenario context (/du-an/{id}/kich-ban/{sid}/...) ──
  if (projectId && scenarioId) {
    const base = `/du-an/${projectId}/kich-ban/${scenarioId}`;
    for (const mod of SCENARIO_MODULES) {
      if (pathname.startsWith(`${base}/${mod}`)) return mod;
    }
    // Scenario detail, /sua, /gia-dinh, /gia-dinh/chinh-sua → "kich-ban"
    return "kich-ban";
  }

  // ── Project context (/du-an/{id}/...) ──
  if (projectId) {
    if (pathname === `/du-an/${projectId}/tong-quan`) return "tong-quan";
    if (pathname.startsWith(`/du-an/${projectId}/kich-ban`)) return "kich-ban";
    return "du-an"; // /du-an/{id}, /du-an/{id}/sua
  }

  // ── /du-an, /du-an/tao-moi ──
  if (pathname.startsWith("/du-an")) return "du-an";

  // ── Top-level placeholder routes ──
  if (pathname === "/tong-quan" || pathname.startsWith("/tong-quan/")) return "tong-quan";
  if (pathname === "/kich-ban" || pathname.startsWith("/kich-ban/")) return "kich-ban";
  for (const mod of SCENARIO_MODULES) {
    if (pathname === `/${mod}` || pathname.startsWith(`/${mod}/`)) return mod;
  }
  if (pathname.startsWith("/thiet-lap")) return "thiet-lap";

  return "";
}

// ─── HREF BUILDING ────────────────────────────────────────────────────────────

function buildHrefs(ctx: Context) {
  const { projectId, scenarioId } = ctx;

  const moduleHref = (slug: string): string =>
    projectId && scenarioId
      ? `/du-an/${projectId}/kich-ban/${scenarioId}/${slug}`
      : `/${slug}`;

  const kichBanHref = (): string => {
    if (projectId && scenarioId) return `/du-an/${projectId}/kich-ban/${scenarioId}`;
    if (projectId) return `/du-an/${projectId}/kich-ban`;
    return "/kich-ban";
  };

  const tongQuanHref = (): string =>
    projectId ? `/du-an/${projectId}/tong-quan` : "/tong-quan";

  return {
    "tong-quan":        tongQuanHref(),
    "du-an":            "/du-an",
    "kich-ban":         kichBanHref(),
    "chi-phi-dat":      moduleHref("chi-phi-dat"),
    "chi-phi-xay-dung": moduleHref("chi-phi-xay-dung"),
    "doanh-thu":        moduleHref("doanh-thu"),
    "von-vay":          moduleHref("von-vay"),
    "dong-tien":        moduleHref("dong-tien"),
    "bao-cao":          moduleHref("bao-cao"),
    "thiet-lap":        "/thiet-lap",
  };
}

// ─── NAV ITEM DEFINITION ─────────────────────────────────────────────────────

interface NavItemDef {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroupDef {
  label?: string;
  items: NavItemDef[];
}

const NAV_GROUPS: NavGroupDef[] = [
  {
    items: [
      { key: "tong-quan", label: "Tổng quan",  icon: LayoutDashboard },
      { key: "du-an",     label: "Dự án",       icon: Building2 },
    ],
  },
  {
    label: "Phân tích",
    items: [
      { key: "kich-ban",         label: "Kịch bản",         icon: GitBranch },
      { key: "chi-phi-dat",      label: "Chi phí đất",       icon: MapPin },
      { key: "chi-phi-xay-dung", label: "Chi phí xây dựng", icon: Hammer },
      { key: "doanh-thu",        label: "Doanh thu",         icon: TrendingUp },
      { key: "von-vay",          label: "Vốn vay",           icon: Banknote },
      { key: "dong-tien",        label: "Dòng tiền",         icon: Activity },
    ],
  },
  {
    label: "Xuất dữ liệu",
    items: [
      { key: "bao-cao", label: "Báo cáo", icon: BarChart3 },
    ],
  },
];

const BOTTOM_ITEMS: NavItemDef[] = [
  { key: "thiet-lap", label: "Thiết lập", icon: Settings },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

function NavLink({
  def,
  href,
  isActive,
}: {
  def: NavItemDef;
  href: string;
  isActive: boolean;
}) {
  const Icon = def.icon;
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-slate-700 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white",
      ].join(" ")}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{def.label}</span>
      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
    </Link>
  );
}

export default function SidebarNav() {
  const pathname = usePathname();
  const ctx = parseContext(pathname);
  const activeKey = getActiveKey(pathname, ctx);
  const hrefs = buildHrefs(ctx);

  return (
    <nav className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-4">
      <div className="space-y-5">
        {NAV_GROUPS.map((group, index) => (
          <div key={index}>
            {group.label && (
              <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.key}
                  def={item}
                  href={hrefs[item.key as keyof typeof hrefs]}
                  isActive={activeKey === item.key}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-slate-800 pt-4 space-y-0.5">
        {BOTTOM_ITEMS.map((item) => (
          <NavLink
            key={item.key}
            def={item}
            href={hrefs[item.key as keyof typeof hrefs]}
            isActive={activeKey === item.key}
          />
        ))}
      </div>
    </nav>
  );
}
