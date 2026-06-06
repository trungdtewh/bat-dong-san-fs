import { test, expect } from "@playwright/test";
import {
  createTestProject,
  createTestScenario,
  cleanupProject,
} from "../helpers/db";

const TS = Date.now();
const ctx = { projectId: "", scenarioId: "" };

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const project = await createTestProject(
    "e2e-admin@fs-test.local",
    `CF-${TS}`
  );
  ctx.projectId = project.id;

  const scenario = await createTestScenario(
    project.id,
    "Kịch bản Dòng tiền E2E"
  );
  ctx.scenarioId = scenario.id;
});

test.afterAll(async () => {
  await cleanupProject(ctx.projectId);
});

test.describe("Nhập dữ liệu tài chính & Tính dòng tiền", () => {
  test("Nhập chi phí đất", async ({ page }) => {
    await page.goto(
      `/du-an/${ctx.projectId}/kich-ban/${ctx.scenarioId}/chi-phi-dat/tao-moi`
    );

    await page.selectOption("#category", "LEGAL_FEES");
    await page.fill("#name", "Chi phí tiền sử dụng đất E2E");
    await page.fill("#paymentMonth", "1");
    await page.fill("#totalAmount", "5000000000");

    await page.getByRole("button", { name: "Lưu chi phí" }).click();
    await page.waitForURL(/chi-phi-dat$/);
    await expect(
      page.getByText("Chi phí tiền sử dụng đất E2E")
    ).toBeVisible();
  });

  test("Nhập giai đoạn xây dựng", async ({ page }) => {
    await page.goto(
      `/du-an/${ctx.projectId}/kich-ban/${ctx.scenarioId}/chi-phi-xay-dung/tao-giai-doan`
    );

    await page.fill("#name", "Giai đoạn Móng E2E");
    await page.fill("#startMonth", "1");
    await page.fill("#endMonth", "6");

    await page.getByRole("button", { name: "Lưu giai đoạn" }).click();
    await page.waitForURL(/chi-phi-xay-dung$/);
    await expect(page.getByText("Giai đoạn Móng E2E")).toBeVisible();
  });

  test("Nhập nhóm sản phẩm (doanh thu)", async ({ page }) => {
    await page.goto(
      `/du-an/${ctx.projectId}/kich-ban/${ctx.scenarioId}/doanh-thu/tao-nhom`
    );

    await page.fill("#name", "Căn hộ Loại A E2E");
    await page.selectOption("#productType", "APARTMENT");
    await page.fill("#totalUnits", "100");
    await page.fill("#area", "70");
    await page.fill("#basePrice", "50000000");

    await page.getByRole("button", { name: "Lưu nhóm sản phẩm" }).click();
    await page.waitForURL(/doanh-thu$/);
    await expect(page.getByText("Căn hộ Loại A E2E")).toBeVisible();
  });

  test("Nhập khoản vay ngân hàng", async ({ page }) => {
    await page.goto(
      `/du-an/${ctx.projectId}/kich-ban/${ctx.scenarioId}/von-vay/tao-moi`
    );

    await page.fill("#name", "Vay NH E2E");
    await page.selectOption("#type", "BANK_LOAN");
    await page.fill("#principalAmount", "10000000000");
    await page.fill("#interestRatePct", "10");
    await page.fill("#tenorMonths", "24");
    await page.fill("#startMonth", "2");

    // Disbursement amount phải > 0 (validation yêu cầu positive integer)
    // Input nằm trong dòng đầu tiên của bảng giải ngân
    await page.locator('table input[type="number"][placeholder="0"]').fill("10000000000");

    await page.getByRole("button", { name: "Lưu khoản vay" }).click();
    await page.waitForURL(/von-vay$/);
    await expect(page.getByText("Vay NH E2E")).toBeVisible();
  });

  test("Tính toán dòng tiền thành công", async ({ page }) => {
    await page.goto(
      `/du-an/${ctx.projectId}/kich-ban/${ctx.scenarioId}/dong-tien`
    );

    await page.getByRole("button", { name: "Tính toán lại" }).first().click();

    // Chờ nút hết trạng thái loading
    await expect(
      page.getByRole("button", { name: "Tính toán lại" }).first()
    ).toBeEnabled({ timeout: 15_000 });

    // Không có thông báo lỗi
    await expect(page.getByText("Bạn không có quyền")).not.toBeVisible();

    // Bảng dòng tiền hoặc KPI hiển thị
    await expect(page.locator("table").first()).toBeVisible();
  });
});
