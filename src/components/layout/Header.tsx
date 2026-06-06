import { Bell, Menu } from "lucide-react";
import UserMenu from "@/components/auth/UserMenu";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6 print:hidden">
      {/* Bên trái */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:hidden"
          aria-label="Mở menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-gray-800 lg:hidden">
          Dòng Tiền BĐS
        </span>
      </div>

      {/* Bên phải */}
      <div className="flex items-center gap-1">
        <button
          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Thông báo"
        >
          <Bell className="h-5 w-5" />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
