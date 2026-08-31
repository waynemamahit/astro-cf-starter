import { expect, test } from "@playwright/test";

const URL = "http://localhost:4321/";

async function waitForCanvas(page: import("@playwright/test").Page) {
	await page.waitForSelector("html[data-canvas-ready]");
}

test("canvas page loads with title", async ({ page }) => {
	await page.goto(URL);
	await waitForCanvas(page);
	await expect(
		page.getByRole("heading", { name: "Interactive Canvas" }),
	).toBeVisible();
	await expect(page.locator("canvas")).toBeVisible();
});

test("user can create a point by clicking the canvas", async ({ page }) => {
	await page.goto(URL);
	await waitForCanvas(page);
	const canvas = page.locator("canvas");
	const box = await canvas.boundingBox();
	if (!box) throw new Error("Canvas not found");

	await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });

	await expect(page.locator("text=Points: 1")).toBeVisible();
});

test("user can create a rectangle by click-drag", async ({ page }) => {
	await page.goto(URL);
	await waitForCanvas(page);
	const canvas = page.locator("canvas");
	const box = await canvas.boundingBox();
	if (!box) throw new Error("Canvas not found");

	const cx = box.x + box.width / 2;
	const cy = box.y + box.height / 2;
	await page.mouse.move(cx, cy);
	await page.mouse.down();
	await page.mouse.move(cx + 100, cy + 80, { steps: 10 });
	await page.mouse.up();

	await expect(page.locator("text=Rectangles: 1")).toBeVisible();
});

test("user can create a square with Shift+drag", async ({ page }) => {
	await page.goto(URL);
	await waitForCanvas(page);
	const canvas = page.locator("canvas");
	const box = await canvas.boundingBox();
	if (!box) throw new Error("Canvas not found");

	const cx = box.x + box.width / 2;
	const cy = box.y + box.height / 2;
	await page.keyboard.down("Shift");
	await page.mouse.move(cx, cy);
	await page.mouse.down();
	await page.mouse.move(cx + 100, cy + 80, { steps: 10 });
	await page.mouse.up();
	await page.keyboard.up("Shift");

	await expect(page.locator("text=Squares: 1")).toBeVisible();
});

test("undo and redo buttons work", async ({ page }) => {
	await page.goto(URL);
	await waitForCanvas(page);
	const canvas = page.locator("canvas");

	await canvas.click({ position: { x: 100, y: 100 } });
	await expect(page.locator("text=Points: 1")).toBeVisible();

	await page.click("text=Undo");
	await expect(page.locator("text=Points: 0")).toBeVisible();

	await page.click("text=Redo");
	await expect(page.locator("text=Points: 1")).toBeVisible();
});

test("user can select a shape by clicking it and delete via button", async ({
	page,
}) => {
	await page.goto(URL);
	await waitForCanvas(page);
	const canvas = page.locator("canvas");

	await canvas.click({ position: { x: 100, y: 150 } });
	await expect(page.locator("text=Points: 1")).toBeVisible();

	const deleteBtn = page.locator("button", { hasText: "Delete" });
	await expect(deleteBtn).toBeVisible();

	await canvas.click({ position: { x: 100, y: 150 } });
	await deleteBtn.click();
	await expect(page.locator("text=Points: 0")).toBeVisible();
});

test("user can delete shape with Delete key", async ({ page }) => {
	await page.goto(URL);
	await waitForCanvas(page);
	const canvas = page.locator("canvas");

	await canvas.click({ position: { x: 100, y: 150 } });
	await expect(page.locator("text=Points: 1")).toBeVisible();

	await canvas.click({ position: { x: 100, y: 150 } });
	await page.keyboard.press("Delete");
	await expect(page.locator("text=Points: 0")).toBeVisible();
});

test("user can undo via Ctrl+Z keyboard shortcut", async ({ page }) => {
	await page.goto(URL);
	await waitForCanvas(page);
	const canvas = page.locator("canvas");

	await canvas.click({ position: { x: 100, y: 150 } });
	await expect(page.locator("text=Points: 1")).toBeVisible();

	await page.keyboard.press("Control+z");
	await expect(page.locator("text=Points: 0")).toBeVisible();
});

test("user can move a rectangle via drag-and-drop", async ({ page }) => {
	await page.goto(URL);
	await waitForCanvas(page);
	const canvas = page.locator("canvas");
	const box = await canvas.boundingBox();
	if (!box) throw new Error("Canvas not found");

	const cx = box.x + box.width / 2;
	const cy = box.y + box.height / 2;
	await page.mouse.move(cx, cy);
	await page.mouse.down();
	await page.mouse.move(cx + 100, cy + 80, { steps: 10 });
	await page.mouse.up();
	await expect(page.locator("text=Rectangles: 1")).toBeVisible();

	const newCx = cx + 50;
	const newCy = cy + 40;
	await page.mouse.move(newCx, newCy);
	await page.mouse.down();
	await page.mouse.move(newCx + 30, newCy + 20, { steps: 5 });
	await page.mouse.up();

	await expect(page.locator("text=Rectangles: 1")).toBeVisible();
});

test("user can reset canvas with confirmation", async ({ page }) => {
	await page.goto(URL);
	await waitForCanvas(page);
	const canvas = page.locator("canvas");
	const box = await canvas.boundingBox();
	if (!box) throw new Error("Canvas not found");

	await canvas.click({ position: { x: 100, y: 150 } });
	await expect(page.locator("text=Points: 1")).toBeVisible();

	page.once("dialog", async (dialog) => {
		await dialog.accept();
	});
	await page.locator("button", { hasText: "Reset" }).click();
	await expect(page.locator("text=Points: 0")).toBeVisible();
});

test("export dropdown shows format options", async ({ page }) => {
	await page.goto(URL);
	await waitForCanvas(page);
	const exportBtn = page.locator("button", { hasText: "Export" });
	await exportBtn.click();
	await expect(page.locator("button", { hasText: "PNG" })).toBeVisible();
	await expect(page.locator("button", { hasText: "JPG" })).toBeVisible();
	await expect(page.locator("button", { hasText: "SVG" })).toBeVisible();
});

test("user guide is visible", async ({ page }) => {
	await page.goto(URL);
	await waitForCanvas(page);
	await expect(page.locator("text=How to Use")).toBeVisible();
	await expect(
		page.locator("text=Click + drag to create a rectangle"),
	).toBeVisible();
});
