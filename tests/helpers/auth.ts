import type { Page } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/dang-nhap");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/du-an/);
}

export async function logout(page: Page) {
  await page.click('button[title="Đăng xuất"]');
  await page.waitForURL(/\/dang-nhap/);
}
