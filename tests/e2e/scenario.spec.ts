import { test, expect } from "@playwright/test";
import { cleanupProjectsByCode } from "../helpers/db";

const TS = Date.now();
const CODE = `E2E-SCN-${TS}`;
const NAME = `[E2E] Kịch bản ${TS}`;

// Trạng thái chia sẻ giữa các bước trong cùng luồng serial
const ctx = { projectId: "", scenarioId: "" };

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  await cleanupProjectsByCode(`E2E-SCN-${TS}`);
});

test.describe("Tạo dự án → Kịch bản → Giả định", () => {
  test("Tạo dự án mới qua giao diện", async ({ page }) => {
    await page.goto("/du-an/tao-moi");
    await page.fill("#code", CODE);
    await page.fill("#name", NAME);
    await page.selectOption("#type", "CHUNG_CU");
    await page.selectOption("#province", "Hà Nội");
    await page.fill("#totalArea", "10000");

    await page.getByRole("button", { name: "Tạo dự án" }).click();
    await page.waitForURL(/\/du-an$/);

    // Tìm dự án vừa tạo và lấy ID từ URL
    const link = page.getByRole("link", { name: NAME }).first();
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL(/\/du-an\/[^/]+$/);

    const parts = page.url().split("/");
    ctx.projectId = parts[parts.length - 1];
    expect(ctx.projectId).toBeTruthy();

    await expect(page.locator("h1")).toContainText(NAME);
  });

  test("Tạo kịch bản mới cho dự án", async ({ page }) => {
    await page.goto(`/du-an/${ctx.projectId}/kich-ban/tao-moi`);
    await page.fill("#name", "Kịch bản Cơ sở E2E");
    await page.fill("#durationMonths", "24");
    await page.fill("#constructionStartMonth", "1");
    await page.fill("#salesStartMonth", "6");
    await page.fill("#discountRate", "12");

    await page.getByRole("button", { name: "Tạo kịch bản" }).click();

    // Chờ redirect đến trang chi tiết kịch bản (h1 xác nhận đã khác trang tao-moi)
    await expect(page.locator("h1").first()).toContainText("Kịch bản Cơ sở E2E", {
      timeout: 15_000,
    });

    // Đọc URL SAU KHI đã redirect xong (tránh đọc sớm khi URL vẫn là tao-moi)
    const finalUrl = page.url();
    const parts = finalUrl.split("/");
    ctx.projectId = parts[parts.length - 3]; // .../du-an/[P]/kich-ban/[S]
    ctx.scenarioId = parts[parts.length - 1];
    expect(ctx.projectId).toBeTruthy();
    expect(ctx.scenarioId).not.toBe("tao-moi");
  });

  test("Nhập giả định tài chính", async ({ page }) => {
    // Vào trang kịch bản trước (client-side nav tránh vấn đề direct URL)
    await page.goto(`/du-an/${ctx.projectId}/kich-ban/${ctx.scenarioId}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });

    // Click "Xem tất cả →" trong section Giả định để vào trang /gia-dinh
    await page.getByRole("link", { name: "Xem tất cả →" }).first().click();
    await page.waitForURL(/gia-dinh$/, { timeout: 10_000 });

    // Click "Thêm giả định" (khi chưa có) hoặc "Chỉnh sửa" (khi đã có) để vào form
    await page.getByRole("link", { name: /Thêm giả định|Chỉnh sửa/ }).first().click();
    await page.waitForURL(/chinh-sua$/, { timeout: 10_000 });

    await page.fill("#inflationRate", "3");
    await page.fill("#corporateTaxRate", "20");
    await page.fill("#vatRate", "10");
    await page.fill("#salesCommissionRate", "2");
    await page.fill("#contingencyRate", "5");
    await page.fill("#loanInterestRate", "10");
    await page.fill("#loanTenorMonths", "24");

    await page.getByRole("button", { name: "Lưu giả định" }).click();
    await page.waitForURL(/gia-dinh$/);

    // Xác nhận giả định đã được lưu
    await expect(page.getByText("3%").first()).toBeVisible();
    await expect(page.getByText("20%").first()).toBeVisible();
  });
});
