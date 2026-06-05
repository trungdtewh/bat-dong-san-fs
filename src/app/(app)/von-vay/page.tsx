import EmptyState from "@/components/ui/EmptyState";
import { Banknote } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vốn vay | FS Dòng Tiền BĐS",
};

export default function VonVayPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Vốn vay</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý các khoản vay ngân hàng, trái phiếu và vốn đối tác
        </p>
      </div>
      <EmptyState
        icon={Banknote}
        title="Chưa có khoản vay nào"
        description="Nhập thông tin vay vốn gồm lãi suất, kỳ hạn, lịch giải ngân và lịch trả nợ cho từng kịch bản."
      />
    </div>
  );
}
