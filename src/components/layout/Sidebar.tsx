import { X } from "lucide-react";
import SidebarNav from "./SidebarNav";

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  return (
    <aside className="flex h-full w-60 flex-col bg-slate-900">
      {/* Tiêu đề */}
      <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-800 px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-xs font-bold text-white">FS</span>
          </div>
          <div>
            <p className="text-sm font-semibold leading-none text-white">
              Dòng Tiền BĐS
            </p>
            <p className="mt-0.5 text-xs text-slate-400">Financial Schedule</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Đóng menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Điều hướng */}
      <SidebarNav />
    </aside>
  );
}
