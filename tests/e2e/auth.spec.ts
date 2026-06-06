import { test, expect } from "@playwright/test";
import { login, logout } from "../helpers/auth";

// Không dùng storageState được lưu sẵn — quản lý session thủ công trong từng test
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Đăng nhập / Đăng xuất", () => {
  test("đăng nhập thành công với tài khoản admin", async ({ page }) => {
    await login(page, "e2e-admin@fs-test.local", "E2eAdmin@123");
    await expect(page).toHaveURL(/\/du-an/);
    await expect(page.locator("h1")).toContainText("Dự án");
  });

  test("đăng nhập thất bại với mật khẩu sai", async ({ page }) => {
    await page.goto("/dang-nhap");
    await page.fill("#email", "e2e-admin@fs-test.local");
    await page.fill("#password", "sai-mat-khau-123");
    await page.click('button[type="submit"]');
    await expect(
      page.getByText("Email hoặc mật khẩu không đúng")
    ).toBeVisible();
    await expect(page).toHaveURL(/\/dang-nhap/);
  });

  test("truy cập trang bảo vệ khi chưa đăng nhập thì redirect về đăng nhập", async ({
    page,
  }) => {
    await page.goto("/du-an");
    await expect(page).toHaveURL(/\/dang-nhap/);
  });

  test("đăng xuất thành công", async ({ page }) => {
    await login(page, "e2e-admin@fs-test.local", "E2eAdmin@123");
    await logout(page);
    await expect(page).toHaveURL(/\/dang-nhap/);
    // Truy cập lại trang protected — phải redirect
    await page.goto("/du-an");
    await expect(page).toHaveURL(/\/dang-nhap/);
  });
});
