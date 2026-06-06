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
    `RPT-${TS}`
  );
  ctx.projectId = project.id;

  const scenario = await createTestScenario(
    project.id,
    "Kịch bản Báo cáo E2E"
  );
  ctx.scenarioId = scenario.id;
});

test.afterAll(async () => {
  await cleanupProject(ctx.projectId);
});

test.describe("Báo cáo kịch bản", () => {
  test("Trang báo cáo tải thành công", async ({ page }) => {
    await page.goto(
      `/du-an/${ctx.projectId}/kich-ban/${ctx.scenarioId}/bao-cao`
    );

    // Tiêu đề trang
    await expect(
      page.getByText("Báo cáo tài chính dự án", { exact: true }).first()
    ).toBeVisible();

    // Tên kịch bản hiển thị
    await expect(
      page.getByText("Kịch bản Báo cáo E2E").first()
    ).toBeVisible();
  });

  test("Nút in báo cáo hiển thị và có thể click", async ({ page }) => {
    await page.goto(
      `/du-an/${ctx.projectId}/kich-ban/${ctx.scenarioId}/bao-cao`
    );

    const printBtn = page.getByRole("button", { name: "In báo cáo" });
    await expect(printBtn).toBeVisible();

    // Bắt sự kiện print trước khi click để không mở hộp thoại in thật
    await page.evaluate(() => {
      window.print = () => {};
    });
    await printBtn.click();
    // Nút vẫn hiển thị sau click (không bị navigate đi)
    await expect(printBtn).toBeVisible();
  });

  test("Phần KPI hiển thị ngay cả khi chưa có dữ liệu dòng tiền", async ({
    page,
  }) => {
    await page.goto(
      `/du-an/${ctx.projectId}/kich-ban/${ctx.scenarioId}/bao-cao`
    );

    // Section tóm tắt điều hành phải hiển thị (dùng role heading để tránh strict mode)
    await expect(
      page.getByRole("heading", { name: /Tóm tắt điều hành/ }).first()
    ).toBeVisible();

    // Thông báo chưa có dữ liệu dòng tiền (có thể xuất hiện ở nhiều nơi)
    await expect(
      page.getByText("Chưa có dữ liệu dòng tiền").first()
    ).toBeVisible();
  });
});
