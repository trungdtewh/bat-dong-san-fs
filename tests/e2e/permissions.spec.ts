import { test, expect } from "@playwright/test";
import {
  createTestProject,
  createTestScenario,
  addTestMember,
  cleanupProject,
} from "../helpers/db";

const TS = Date.now();
const ctx = { projectId: "", scenarioId: "" };

test.describe("Phân quyền dự án", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    const project = await createTestProject(
      "e2e-owner@fs-test.local",
      `PERM-${TS}`
    );
    ctx.projectId = project.id;

    const scenario = await createTestScenario(project.id, "Kịch bản Phân quyền");
    ctx.scenarioId = scenario.id;

    await addTestMember(project.id, "e2e-editor@fs-test.local", "EDITOR");
    await addTestMember(project.id, "e2e-viewer@fs-test.local", "VIEWER");
  });

  test.afterAll(async () => {
    await cleanupProject(ctx.projectId);
  });

  // ── VIEWER ──────────────────────────────────────────────────────────────────

  test.describe("Vai trò VIEWER", () => {
    test.use({ storageState: ".auth/viewer.json" });

    test("có thể xem danh sách dự án", async ({ page }) => {
      await page.goto("/du-an");
      await expect(page).toHaveURL(/\/du-an/);
      await expect(page.locator("h1")).toContainText("Dự án");
    });

    test("có thể xem trang kịch bản", async ({ page }) => {
      await page.goto(`/du-an/${ctx.projectId}/kich-ban/${ctx.scenarioId}`);
      // VIEWER không bị redirect về đăng nhập
      await expect(page).not.toHaveURL(/\/dang-nhap/);
      // Trang kịch bản tải được (có h1 hoặc tiêu đề)
      await expect(page.locator("h1, h2").first()).toBeVisible();
    });

    test("tạo kịch bản bị từ chối — lỗi phân quyền", async ({ page }) => {
      await page.goto(`/du-an/${ctx.projectId}/kich-ban/tao-moi`);
      await page.fill("#name", "Kịch bản VIEWER thử tạo");
      await page.fill("#durationMonths", "12");
      await page.getByRole("button", { name: "Tạo kịch bản" }).click();

      // Server action trả về lỗi — form hiển thị thông báo từ chối
      await expect(
        page.getByText("Bạn không có quyền thực hiện hành động này")
      ).toBeVisible({ timeout: 8_000 });
    });

    test("thêm chi phí đất bị từ chối — lỗi phân quyền", async ({ page }) => {
      await page.goto(
        `/du-an/${ctx.projectId}/kich-ban/${ctx.scenarioId}/chi-phi-dat/tao-moi`
      );
      await page.fill("#name", "Chi phí VIEWER thử");
      await page.fill("#paymentMonth", "1");
      await page.fill("#totalAmount", "1000000");
      await page.getByRole("button", { name: "Lưu chi phí" }).click();

      await expect(
        page.getByText("Bạn không có quyền thực hiện hành động này")
      ).toBeVisible({ timeout: 8_000 });
    });
  });

  // ── EDITOR ──────────────────────────────────────────────────────────────────

  test.describe("Vai trò EDITOR", () => {
    test.use({ storageState: ".auth/editor.json" });

    test("có thể xem dự án và kịch bản", async ({ page }) => {
      await page.goto(`/du-an/${ctx.projectId}/kich-ban/${ctx.scenarioId}`);
      await expect(page.locator("h1").first()).toContainText("Kịch bản Phân quyền");
    });

    test("có thể thêm chi phí đất", async ({ page }) => {
      await page.goto(
        `/du-an/${ctx.projectId}/kich-ban/${ctx.scenarioId}/chi-phi-dat/tao-moi`
      );
      await page.fill("#name", "Chi phí EDITOR thêm E2E");
      await page.fill("#paymentMonth", "2");
      await page.fill("#totalAmount", "2000000000");
      await page.getByRole("button", { name: "Lưu chi phí" }).click();
      await page.waitForURL(/chi-phi-dat$/, { timeout: 10_000 });
      await expect(
        page.getByText("Chi phí EDITOR thêm E2E")
      ).toBeVisible();
    });

    test("không thể truy cập trang quản trị admin", async ({ page }) => {
      await page.goto("/admin");
      // getRequiredAdminSession throws FORBIDDEN → notFound() → 404, URL giữ nguyên
      // Nhưng nội dung admin thật (sidebar "Quản trị hệ thống") không hiển thị
      await expect(page.getByText("Quản trị hệ thống")).not.toBeVisible();
    });
  });

  // ── OWNER ────────────────────────────────────────────────────────────────────

  test.describe("Vai trò OWNER", () => {
    test.use({ storageState: ".auth/owner.json" });

    test("có thể xem trang thành viên", async ({ page }) => {
      await page.goto(`/du-an/${ctx.projectId}/thanh-vien`);
      await expect(page.locator("h1")).toContainText("Thành viên dự án");
    });

    test("có thể thêm thành viên mới vào dự án", async ({ page }) => {
      await page.goto(`/du-an/${ctx.projectId}/thanh-vien`);
      // Form thêm thành viên phải hiển thị
      await expect(
        page.getByPlaceholder("ten@congty.vn").or(page.getByLabel("Email"))
      ).toBeVisible();
    });
  });

  // ── ADMIN ────────────────────────────────────────────────────────────────────

  test.describe("Vai trò ADMIN", () => {
    test.use({ storageState: ".auth/admin.json" });

    test("có thể truy cập trang quản trị", async ({ page }) => {
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/admin/);
      await expect(page.locator("h1").or(page.locator("h2"))).toBeVisible();
    });

    test("có thể xem tất cả dự án", async ({ page }) => {
      await page.goto("/du-an");
      await expect(page.locator("h1")).toContainText("Dự án");
    });
  });
});
