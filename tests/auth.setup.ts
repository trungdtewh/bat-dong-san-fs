import { test as setup } from "@playwright/test";
import { mkdirSync } from "fs";
import { TEST_USERS } from "./global-setup";

setup.beforeAll(() => {
  mkdirSync(".auth", { recursive: true });
});

for (const user of TEST_USERS) {
  setup(`lưu phiên: ${user.email}`, async ({ page }) => {
    await page.goto("/dang-nhap");
    await page.fill("#email", user.email);
    await page.fill("#password", user.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/du-an/);
    await page.context().storageState({ path: user.authFile });
  });
}
