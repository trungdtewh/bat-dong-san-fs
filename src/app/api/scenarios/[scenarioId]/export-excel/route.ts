import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getScenarioFullReport } from "@/lib/db/scenarios";
import { assertProjectAccess } from "@/lib/db/access";
import { LAND_COST_CATEGORY_LABELS } from "@/lib/validations/land-cost";
import { REVENUE_PRODUCT_TYPE_LABELS, PRICE_UNIT_LABELS } from "@/lib/validations/product-group";
import { LOAN_TYPE_LABELS, REPAYMENT_METHOD_LABELS } from "@/lib/validations/loan";
import { EQUITY_SOURCE_TYPE_LABELS } from "@/lib/validations/equity-contribution";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function toNum(d: { toString(): string } | null | undefined): number {
  return d != null ? parseFloat(d.toString()) : 0;
}

function fPct(n: number): string {
  return (n * 100).toFixed(2) + "%";
}

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1E3A5F" },
};

const SUBHEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF2D5F8A" },
};

const TOTAL_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE8EEF4" },
};

const WHITE_FONT: Partial<ExcelJS.Font> = { color: { argb: "FFFFFFFF" }, bold: true };
const BOLD_FONT: Partial<ExcelJS.Font> = { bold: true };

function styleHeader(row: ExcelJS.Row, colCount: number) {
  row.height = 22;
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.fill = HEADER_FILL;
    cell.font = { ...WHITE_FONT, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFB0C4D8" } },
    };
  }
}

function styleSubheader(row: ExcelJS.Row, colCount: number) {
  row.height = 20;
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.fill = SUBHEADER_FILL;
    cell.font = { ...WHITE_FONT, size: 10 };
    cell.alignment = { vertical: "middle" };
  }
}

function styleTotal(row: ExcelJS.Row, colCount: number) {
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.fill = TOTAL_FILL;
    cell.font = { ...BOLD_FONT };
    cell.border = {
      top: { style: "thin", color: { argb: "FF9EB8D1" } },
    };
  }
}

const VND_FMT = '#,##0';
const PCT_FMT = '0.00%';

// ─── SHEET BUILDERS ───────────────────────────────────────────────────────────

function buildTongQuan(wb: ExcelJS.Workbook, data: NonNullable<Awaited<ReturnType<typeof getScenarioFullReport>>>) {
  const ws = wb.addWorksheet("1. Tổng quan dự án");
  ws.columns = [
    { width: 30 },
    { width: 45 },
  ];

  const addRow = (label: string, value: string | number | null, fmt?: string) => {
    const row = ws.addRow([label, value]);
    row.getCell(1).font = BOLD_FONT;
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F7FA" } };
    if (fmt) row.getCell(2).numFmt = fmt;
    row.getCell(2).alignment = { horizontal: "left" };
  };

  // Title
  const title = ws.addRow(["THÔNG TIN DỰ ÁN VÀ KỊCH BẢN"]);
  title.font = { bold: true, size: 13, color: { argb: "FF1E3A5F" } };
  title.height = 24;
  ws.addRow([]);

  // Dự án
  const projHeader = ws.addRow(["THÔNG TIN DỰ ÁN"]);
  styleSubheader(projHeader, 2);
  ws.mergeCells(`A${projHeader.number}:B${projHeader.number}`);

  addRow("Tên dự án", data.project?.name ?? "—");
  addRow("Mã dự án", data.project?.code ?? "—");
  addRow("Ngày bắt đầu", data.project?.startDate ? new Intl.DateTimeFormat("vi-VN").format(new Date(data.project.startDate)) : "—");
  addRow("Ngày kết thúc", data.project?.endDate ? new Intl.DateTimeFormat("vi-VN").format(new Date(data.project.endDate)) : "—");
  ws.addRow([]);

  // Kịch bản
  const scHeader = ws.addRow(["THÔNG TIN KỊCH BẢN"]);
  styleSubheader(scHeader, 2);
  ws.mergeCells(`A${scHeader.number}:B${scHeader.number}`);

  const SCENARIO_TYPE_LABELS: Record<string, string> = {
    BASE: "Kịch bản gốc",
    OPTIMISTIC: "Lạc quan",
    PESSIMISTIC: "Bi quan",
    CUSTOM: "Tùy chỉnh",
  };

  addRow("Tên kịch bản", data.name);
  addRow("Loại kịch bản", SCENARIO_TYPE_LABELS[data.type] ?? data.type);
  addRow("Kịch bản gốc", data.isBase ? "Có" : "Không");
  addRow("Thời gian (tháng)", data.durationMonths ?? "—");
  addRow("Tháng khởi công XD", data.constructionStartMonth ?? "—");
  addRow("Tháng mở bán", data.salesStartMonth ?? "—");
  addRow("Tháng bàn giao", data.handoverStartMonth ?? "—");
  addRow("Tỷ lệ chiết khấu/năm", data.discountRate ? fPct(toNum(data.discountRate)) : "—");
  addRow("Mô tả", data.description ?? "—");
  addRow("Ngày xuất báo cáo", new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date()));
}

function buildGiaDinh(wb: ExcelJS.Workbook, data: NonNullable<Awaited<ReturnType<typeof getScenarioFullReport>>>) {
  const ws = wb.addWorksheet("2. Giả định");
  ws.columns = [{ width: 35 }, { width: 20 }];

  const a = data.assumption;
  if (!a) {
    ws.addRow(["Chưa có dữ liệu giả định"]);
    return;
  }

  const title = ws.addRow(["GIẢ ĐỊNH KINH TẾ - TÀI CHÍNH"]);
  title.font = { bold: true, size: 13, color: { argb: "FF1E3A5F" } };
  title.height = 24;
  ws.addRow([]);

  const groups: { header: string; rows: [string, number | string | null][] }[] = [
    {
      header: "NHÓM 1: KINH TẾ VĨ MÔ",
      rows: [
        ["Lạm phát hàng năm", toNum(a.inflationRate)],
        ["Tỷ lệ tăng giá bán", a.priceEscalationRate != null ? toNum(a.priceEscalationRate) : null],
        ["Tỷ lệ tăng chi phí XD", a.constructionEscalationRate != null ? toNum(a.constructionEscalationRate) : null],
        ["Tỷ lệ tăng giá đất", a.landPriceEscalationRate != null ? toNum(a.landPriceEscalationRate) : null],
      ],
    },
    {
      header: "NHÓM 2: THUẾ & PHÍ",
      rows: [
        ["Thuế TNDN", toNum(a.corporateTaxRate)],
        ["Thuế GTGT", toNum(a.vatRate)],
        ["Thuế chuyển nhượng đất", a.landTransferTaxRate != null ? toNum(a.landTransferTaxRate) : null],
      ],
    },
    {
      header: "NHÓM 3: CHI PHÍ BÁN HÀNG",
      rows: [
        ["Phí môi giới / hoa hồng", toNum(a.salesCommissionRate)],
        ["Chi phí marketing", a.marketingCostRate != null ? toNum(a.marketingCostRate) : null],
      ],
    },
    {
      header: "NHÓM 4: DỰ PHÒNG",
      rows: [
        ["Dự phòng chi phí", toNum(a.contingencyRate)],
      ],
    },
    {
      header: "NHÓM 5: CẤU TRÚC VỐN & VAY",
      rows: [
        ["Tỷ lệ nợ vay / tổng vốn", a.debtRatio != null ? toNum(a.debtRatio) : null],
        ["Tỷ lệ vốn chủ sở hữu", a.equityRatio != null ? toNum(a.equityRatio) : null],
        ["Lãi suất vay/năm", a.loanInterestRate != null ? toNum(a.loanInterestRate) : null],
        ["Kỳ hạn vay (tháng)", a.loanTenorMonths ?? null],
        ["Thời gian ân hạn (tháng)", a.gracePeriodMonths ?? null],
      ],
    },
  ];

  for (const group of groups) {
    ws.addRow([]);
    const gh = ws.addRow([group.header]);
    styleSubheader(gh, 2);
    ws.mergeCells(`A${gh.number}:B${gh.number}`);

    for (const [label, val] of group.rows) {
      const row = ws.addRow([label, val]);
      row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F7FA" } };
      row.getCell(1).font = BOLD_FONT;
      if (typeof val === "number") {
        row.getCell(2).numFmt = PCT_FMT;
      }
      if (val === null) {
        row.getCell(2).value = "—";
      }
    }
  }

  if (a.notes) {
    ws.addRow([]);
    ws.addRow(["Ghi chú", a.notes]);
  }
}

function buildChiPhiDat(wb: ExcelJS.Workbook, data: NonNullable<Awaited<ReturnType<typeof getScenarioFullReport>>>) {
  const ws = wb.addWorksheet("3. Chi phí đất");
  ws.columns = [
    { key: "stt", width: 8 },
    { key: "category", width: 22 },
    { key: "name", width: 30 },
    { key: "area", width: 18 },
    { key: "unitPrice", width: 22 },
    { key: "totalAmount", width: 24 },
    { key: "paymentMonth", width: 16 },
    { key: "notes", width: 30 },
  ];

  const hdr = ws.addRow(["STT", "Danh mục", "Tên khoản mục", "Diện tích (m²)", "Đơn giá (₫/m²)", "Thành tiền (₫)", "Tháng thanh toán", "Ghi chú"]);
  styleHeader(hdr, 8);

  let total = 0;
  data.landCosts.forEach((lc, i) => {
    const amt = toNum(lc.totalAmount);
    total += amt;
    const row = ws.addRow([
      i + 1,
      LAND_COST_CATEGORY_LABELS[lc.category as keyof typeof LAND_COST_CATEGORY_LABELS] ?? lc.category,
      lc.name,
      lc.area ?? null,
      lc.unitPrice != null ? toNum(lc.unitPrice) : null,
      amt,
      lc.paymentMonth,
      lc.notes ?? "",
    ]);
    row.getCell(4).numFmt = '#,##0.00';
    row.getCell(5).numFmt = VND_FMT;
    row.getCell(6).numFmt = VND_FMT;
    if (i % 2 === 1) {
      for (let c = 1; c <= 8; c++) {
        row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FBFD" } };
      }
    }
  });

  const totalRow = ws.addRow(["", "TỔNG CHI PHÍ ĐẤT", "", null, null, total, "", ""]);
  styleTotal(totalRow, 8);
  totalRow.getCell(6).numFmt = VND_FMT;
  ws.mergeCells(`B${totalRow.number}:E${totalRow.number}`);
}

function buildChiPhiXayDung(wb: ExcelJS.Workbook, data: NonNullable<Awaited<ReturnType<typeof getScenarioFullReport>>>) {
  const ws = wb.addWorksheet("4. Chi phí xây dựng");
  ws.columns = [
    { width: 8 },
    { width: 35 },
    { width: 16 },
    { width: 16 },
    { width: 25 },
    { width: 20 },
  ];

  const hdr = ws.addRow(["STT", "Giai đoạn / Gói thầu", "Tháng bắt đầu", "Tháng kết thúc", "Giá trị hợp đồng (₫)", "Phân bổ"]);
  styleHeader(hdr, 6);

  let grandTotal = 0;
  let phaseIdx = 0;
  for (const ph of data.constructionPhases) {
    phaseIdx++;
    const phTotal = ph.packages.reduce((s, p) => s + toNum(p.contractValue), 0);
    grandTotal += phTotal;

    const phRow = ws.addRow([`GĐ ${phaseIdx}`, ph.name, ph.startMonth ?? "", ph.endMonth ?? "", phTotal, ""]);
    styleSubheader(phRow, 6);
    phRow.getCell(5).numFmt = VND_FMT;

    ph.packages.forEach((pkg, pi) => {
      const val = toNum(pkg.contractValue);
      const DIST_LABELS: Record<string, string> = {
        UNIFORM: "Đều",
        S_CURVE: "S-Curve",
        FRONT_LOADED: "Tập trung đầu",
        BACK_LOADED: "Tập trung cuối",
        CUSTOM: "Tùy chỉnh",
      };
      const row = ws.addRow([
        `  ${pi + 1}`,
        `└ ${pkg.name}`,
        pkg.startMonth,
        pkg.endMonth,
        val,
        DIST_LABELS[pkg.distributionType] ?? pkg.distributionType,
      ]);
      row.getCell(5).numFmt = VND_FMT;
      if (pi % 2 === 1) {
        for (let c = 1; c <= 6; c++) {
          row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FBFD" } };
        }
      }
    });
  }

  const totalRow = ws.addRow(["", "TỔNG CHI PHÍ XÂY DỰNG", "", "", grandTotal, ""]);
  styleTotal(totalRow, 6);
  totalRow.getCell(5).numFmt = VND_FMT;
  ws.mergeCells(`B${totalRow.number}:D${totalRow.number}`);
}

function buildDoanhThu(wb: ExcelJS.Workbook, data: NonNullable<Awaited<ReturnType<typeof getScenarioFullReport>>>) {
  const ws = wb.addWorksheet("5. Doanh thu");
  ws.columns = [
    { width: 8 },
    { width: 30 },
    { width: 18 },
    { width: 14 },
    { width: 16 },
    { width: 14 },
    { width: 22 },
    { width: 14 },
    { width: 14 },
    { width: 20 },
  ];

  const hdr = ws.addRow(["STT", "Nhóm sản phẩm", "Loại sản phẩm", "Số lượng", "Diện tích (m²)", "Đơn vị giá", "Giá gốc (₫)", "VAT", "Số đợt bán", "Ghi chú"]);
  styleHeader(hdr, 10);

  let totalUnits = 0;
  data.productGroups.forEach((g, i) => {
    totalUnits += g.totalUnits;
    const row = ws.addRow([
      i + 1,
      g.name,
      REVENUE_PRODUCT_TYPE_LABELS[g.productType as keyof typeof REVENUE_PRODUCT_TYPE_LABELS] ?? g.productType,
      g.totalUnits,
      g.area ?? null,
      PRICE_UNIT_LABELS[g.priceUnit as keyof typeof PRICE_UNIT_LABELS] ?? g.priceUnit,
      toNum(g.basePrice),
      toNum(g.vatRate),
      g.batches.length,
      g.notes ?? "",
    ]);
    row.getCell(5).numFmt = '#,##0.00';
    row.getCell(7).numFmt = VND_FMT;
    row.getCell(8).numFmt = PCT_FMT;
    if (i % 2 === 1) {
      for (let c = 1; c <= 10; c++) {
        row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FBFD" } };
      }
    }
  });

  const totalRow = ws.addRow(["", "TỔNG", "", totalUnits, null, "", null, null, null, ""]);
  styleTotal(totalRow, 10);

  // Đợt bán chi tiết
  if (data.productGroups.some((g) => g.batches.length > 0)) {
    ws.addRow([]);
    ws.addRow([]);
    const bh = ws.addRow(["CHI TIẾT ĐỢT BÁN"]);
    bh.font = { bold: true, size: 12, color: { argb: "FF1E3A5F" } };
    bh.height = 22;

    const bhdr = ws.addRow(["STT", "Nhóm sản phẩm", "Tên đợt bán", "Tháng mở bán", "Số lượng", "Vận tốc bán/th.", "Tăng giá (%/năm)", "Tiến độ thu tiền"]);
    styleHeader(bhdr, 8);

    let bIdx = 0;
    for (const g of data.productGroups) {
      for (const b of g.batches) {
        bIdx++;
        const row = ws.addRow([
          bIdx,
          g.name,
          b.name,
          b.launchMonth,
          b.unitsOffered,
          toNum(b.salesVelocity),
          b.priceAdjustmentRate != null ? toNum(b.priceAdjustmentRate) : null,
          b.collectionSchedule ? "Có lịch tùy chỉnh" : "Mặc định",
        ]);
        if (b.priceAdjustmentRate != null) {
          row.getCell(7).numFmt = PCT_FMT;
        }
      }
    }
  }
}

function buildVonVay(wb: ExcelJS.Workbook, data: NonNullable<Awaited<ReturnType<typeof getScenarioFullReport>>>) {
  const ws = wb.addWorksheet("6. Vốn vay");
  ws.columns = [
    { width: 8 },
    { width: 28 },
    { width: 20 },
    { width: 18 },
    { width: 24 },
    { width: 16 },
    { width: 16 },
    { width: 22 },
    { width: 16 },
    { width: 20 },
  ];

  // Khoản vay
  const lh = ws.addRow(["DANH SÁCH KHOẢN VAY"]);
  lh.font = { bold: true, size: 12, color: { argb: "FF1E3A5F" } };
  lh.height = 22;
  ws.mergeCells(`A${lh.number}:J${lh.number}`);

  const lhdr = ws.addRow(["STT", "Tên khoản vay", "Tổ chức cho vay", "Loại vay", "Dư nợ gốc (₫)", "Lãi suất/năm", "Kỳ hạn (th.)", "Phương thức trả", "Bắt đầu th.", "Ân hạn (th.)"]);
  styleHeader(lhdr, 10);

  let totalPrincipal = 0;
  data.loans.forEach((l, i) => {
    const amt = toNum(l.principalAmount);
    totalPrincipal += amt;
    const row = ws.addRow([
      i + 1,
      l.name,
      l.lenderName ?? "—",
      LOAN_TYPE_LABELS[l.type as keyof typeof LOAN_TYPE_LABELS] ?? l.type,
      amt,
      toNum(l.interestRate),
      l.tenorMonths,
      REPAYMENT_METHOD_LABELS[l.repaymentMethod as keyof typeof REPAYMENT_METHOD_LABELS] ?? l.repaymentMethod,
      l.startMonth,
      l.gracePeriodMonths ?? 0,
    ]);
    row.getCell(5).numFmt = VND_FMT;
    row.getCell(6).numFmt = PCT_FMT;
    if (i % 2 === 1) {
      for (let c = 1; c <= 10; c++) {
        row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FBFD" } };
      }
    }
  });

  const lTotalRow = ws.addRow(["", "TỔNG DƯ NỢ GỐC", "", "", totalPrincipal, "", "", "", "", ""]);
  styleTotal(lTotalRow, 10);
  lTotalRow.getCell(5).numFmt = VND_FMT;

  // Góp vốn
  ws.addRow([]);
  ws.addRow([]);
  const eh = ws.addRow(["DANH SÁCH GÓP VỐN"]);
  eh.font = { bold: true, size: 12, color: { argb: "FF1E3A5F" } };
  eh.height = 22;
  ws.mergeCells(`A${eh.number}:J${eh.number}`);

  const ehdr = ws.addRow(["STT", "Tên đợt góp vốn", "Loại nguồn vốn", "Bên góp vốn", "Tổng số tiền (₫)", "", "", "", "", ""]);
  styleHeader(ehdr, 5);

  let totalEquity = 0;
  data.equityContributions.forEach((eq, i) => {
    const amt = toNum(eq.totalAmount);
    totalEquity += amt;
    const row = ws.addRow([
      i + 1,
      eq.name,
      EQUITY_SOURCE_TYPE_LABELS[eq.sourceType as keyof typeof EQUITY_SOURCE_TYPE_LABELS] ?? eq.sourceType,
      eq.contributorName ?? "—",
      amt,
    ]);
    row.getCell(5).numFmt = VND_FMT;
  });

  const eTotalRow = ws.addRow(["", "TỔNG GÓP VỐN", "", "", totalEquity]);
  styleTotal(eTotalRow, 5);
  eTotalRow.getCell(5).numFmt = VND_FMT;
}

function buildDongTien(wb: ExcelJS.Workbook, data: NonNullable<Awaited<ReturnType<typeof getScenarioFullReport>>>) {
  const ws = wb.addWorksheet("7. Dòng tiền");
  ws.columns = [
    { key: "month", width: 10 },
    { key: "revCol", width: 22 },
    { key: "loanDisb", width: 22 },
    { key: "equity", width: 18 },
    { key: "totalIn", width: 22 },
    { key: "landPay", width: 18 },
    { key: "constPay", width: 18 },
    { key: "loanRep", width: 18 },
    { key: "interest", width: 18 },
    { key: "tax", width: 18 },
    { key: "other", width: 18 },
    { key: "totalOut", width: 22 },
    { key: "net", width: 22 },
    { key: "cumulative", width: 22 },
  ];

  const hdr = ws.addRow([
    "Tháng",
    "Thu doanh thu (₫)",
    "Giải ngân vay (₫)",
    "Góp vốn (₫)",
    "Tổng thu (₫)",
    "Chi đất (₫)",
    "Chi xây dựng (₫)",
    "Trả gốc (₫)",
    "Trả lãi (₫)",
    "Thuế (₫)",
    "Chi khác (₫)",
    "Tổng chi (₫)",
    "Ròng (₫)",
    "Lũy kế (₫)",
  ]);
  styleHeader(hdr, 14);
  ws.getRow(1).height = 26;

  const entries = data.cashFlowEntries;
  const totals = {
    revCol: 0, loanDisb: 0, equity: 0, totalIn: 0,
    landPay: 0, constPay: 0, loanRep: 0, interest: 0,
    tax: 0, other: 0, totalOut: 0,
  };

  entries.forEach((e, i) => {
    const revCol = toNum(e.revenueCollection);
    const loanDisb = toNum(e.loanDisbursement);
    const equity = toNum(e.equityInflow);
    const totalIn = toNum(e.totalInflow);
    const landPay = toNum(e.landPayment);
    const constPay = toNum(e.constructionPayment);
    const loanRep = toNum(e.loanRepayment);
    const interest = toNum(e.interestPayment);
    const tax = toNum(e.taxPayment);
    const other = toNum(e.otherOutflow);
    const totalOut = toNum(e.totalOutflow);
    const net = toNum(e.netCashFlow);
    const cum = toNum(e.cumulativeCashFlow);

    totals.revCol += revCol;
    totals.loanDisb += loanDisb;
    totals.equity += equity;
    totals.totalIn += totalIn;
    totals.landPay += landPay;
    totals.constPay += constPay;
    totals.loanRep += loanRep;
    totals.interest += interest;
    totals.tax += tax;
    totals.other += other;
    totals.totalOut += totalOut;

    const row = ws.addRow([
      e.projectMonth, revCol, loanDisb, equity, totalIn,
      landPay, constPay, loanRep, interest, tax, other,
      totalOut, net, cum,
    ]);

    for (let c = 2; c <= 14; c++) {
      row.getCell(c).numFmt = VND_FMT;
    }
    row.getCell(1).alignment = { horizontal: "center" };

    if (cum < 0) {
      row.getCell(14).font = { color: { argb: "FFCC0000" } };
    } else {
      row.getCell(14).font = { color: { argb: "FF006600" } };
    }
    if (net < 0) {
      row.getCell(13).font = { color: { argb: "FFCC0000" } };
    }

    if (i % 2 === 1) {
      for (let c = 1; c <= 14; c++) {
        row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FBFD" } };
      }
    }
  });

  const tRow = ws.addRow([
    "TỔNG",
    totals.revCol, totals.loanDisb, totals.equity, totals.totalIn,
    totals.landPay, totals.constPay, totals.loanRep, totals.interest,
    totals.tax, totals.other, totals.totalOut,
    null, null,
  ]);
  styleTotal(tRow, 14);
  for (let c = 2; c <= 12; c++) {
    tRow.getCell(c).numFmt = VND_FMT;
  }
  tRow.getCell(1).alignment = { horizontal: "center" };

  ws.autoFilter = { from: "A1", to: "N1" };
  ws.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }];
}

function buildKpi(wb: ExcelJS.Workbook, data: NonNullable<Awaited<ReturnType<typeof getScenarioFullReport>>>) {
  const ws = wb.addWorksheet("8. KPI");
  ws.columns = [{ width: 35 }, { width: 25 }];

  const title = ws.addRow(["CHỈ TIÊU TÀI CHÍNH (KPI)"]);
  title.font = { bold: true, size: 13, color: { argb: "FF1E3A5F" } };
  title.height = 24;
  ws.mergeCells(`A${title.number}:B${title.number}`);
  ws.addRow([]);

  const kpi = data.kpiSnapshot;
  const entries = data.cashFlowEntries;

  const totalRevenue = kpi ? toNum(kpi.totalRevenue)
    : entries.reduce((s, e) => s + toNum(e.revenueCollection), 0);
  const totalCost = kpi ? toNum(kpi.totalCost)
    : entries.reduce((s, e) => s + toNum(e.landPayment) + toNum(e.constructionPayment) + toNum(e.interestPayment) + toNum(e.taxPayment) + toNum(e.otherOutflow), 0);
  const grossProfit = totalRevenue - totalCost;

  const hdr = ws.addRow(["Chỉ tiêu", "Giá trị"]);
  styleHeader(hdr, 2);

  const kpiRows: [string, number | string | null, string?][] = [
    ["Tổng doanh thu (₫)", totalRevenue, VND_FMT],
    ["Tổng chi phí (₫)", totalCost, VND_FMT],
    ["Lợi nhuận gộp (₫)", grossProfit, VND_FMT],
    ["Biên lợi nhuận (%)", totalRevenue > 0 ? grossProfit / totalRevenue : null, PCT_FMT],
    ["IRR (năm)", kpi ? toNum(kpi.irr) : null, PCT_FMT],
    ["NPV (₫)", kpi ? toNum(kpi.npv) : null, VND_FMT],
    ["ROI (%)", kpi ? toNum(kpi.roi) : null, PCT_FMT],
    ["Tháng hoàn vốn", kpi?.paybackPeriodMonths ?? null],
    ["Nhu cầu vốn đỉnh điểm (₫)", kpi ? Math.abs(toNum(kpi.peakFundingRequirement)) : null, VND_FMT],
    ["Tháng đỉnh vốn", kpi?.peakFundingMonth ?? null],
  ];

  kpiRows.forEach(([label, value, fmt], i) => {
    const row = ws.addRow([label, value ?? "Chưa tính"]);
    row.getCell(1).font = BOLD_FONT;
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? "FFF5F7FA" : "FFFFFFFF" } };
    if (fmt && value != null && typeof value === "number") {
      row.getCell(2).numFmt = fmt;
    }
  });

  if (kpi) {
    ws.addRow([]);
    const calcRow = ws.addRow(["Tính toán lúc", new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(kpi.computedAt))]);
    calcRow.getCell(1).font = { italic: true, color: { argb: "FF888888" } };
    calcRow.getCell(2).font = { italic: true, color: { argb: "FF888888" } };
  } else {
    ws.addRow([]);
    const noteRow = ws.addRow(["Lưu ý", "Chưa có dữ liệu dòng tiền — một số KPI chưa được tính toán"]);
    noteRow.getCell(1).font = { bold: true, color: { argb: "FFCC6600" } };
    noteRow.getCell(2).font = { color: { argb: "FFCC6600" } };
  }
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { scenarioId } = await params;
  const data = await getScenarioFullReport(scenarioId);
  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy kịch bản" }, { status: 404 });
  }

  try {
    await assertProjectAccess(session.user.id, data.projectId);
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "FS Dòng Tiền BĐS";
  wb.created = new Date();
  wb.modified = new Date();
  wb.properties.date1904 = false;

  buildTongQuan(wb, data);
  buildGiaDinh(wb, data);
  buildChiPhiDat(wb, data);
  buildChiPhiXayDung(wb, data);
  buildDoanhThu(wb, data);
  buildVonVay(wb, data);
  buildDongTien(wb, data);
  buildKpi(wb, data);

  const buffer = await wb.xlsx.writeBuffer();

  const safeName = (data.project?.name ?? "du-an")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
  const safeScenario = data.name
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 30);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `FS_${safeName}_${safeScenario}_${dateStr}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
