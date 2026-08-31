/** @jsxImportSource react */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import UserGuide from "../UserGuide";

afterEach(() => {
	cleanup();
});

describe("UserGuide", () => {
	it("renders user guide heading", () => {
		render(<UserGuide />);
		expect(screen.getByText("How to Use")).toBeDefined();
	});

	it("displays mouse control instructions", () => {
		render(<UserGuide />);
		const listItems = screen.getAllByRole("listitem");
		const texts = listItems.map((li) => li.textContent);
		expect(texts.some((t) => t?.includes("canvas to create a point"))).toBe(
			true,
		);
		expect(texts.some((t) => t?.includes("to create a rectangle"))).toBe(true);
		expect(texts.some((t) => t?.includes("to create a square"))).toBe(true);
	});

	it("displays selection instructions", () => {
		render(<UserGuide />);
		const listItems = screen.getAllByRole("listitem");
		const texts = listItems.map((li) => li.textContent);
		expect(texts.some((t) => t?.includes("to select it"))).toBe(true);
		expect(texts.some((t) => t?.includes("to move it"))).toBe(true);
	});

	it("displays resize instructions", () => {
		render(<UserGuide />);
		const listItems = screen.getAllByRole("listitem");
		const texts = listItems.map((li) => li.textContent);
		expect(texts.some((t) => t?.includes("to resize"))).toBe(true);
	});

	it("displays keyboard shortcuts", () => {
		render(<UserGuide />);
		const listItems = screen.getAllByRole("listitem");
		const texts = listItems.map((li) => li.textContent);
		expect(texts.some((t) => t?.includes("to delete selected"))).toBe(true);
		expect(texts.some((t) => t?.includes("to undo"))).toBe(true);
		expect(texts.some((t) => t?.includes("to redo"))).toBe(true);
	});

	it("displays all required sections", () => {
		render(<UserGuide />);
		const listItems = screen.getAllByRole("listitem");
		expect(listItems.length).toBeGreaterThanOrEqual(7);
	});
});
