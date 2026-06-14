import { expect, test } from "@playwright/test";

test("page loads correctly", async ({ page }) => {
	await page.goto("http://localhost:4321/");

	await expect(page).toHaveTitle("Astro Basics");
});
