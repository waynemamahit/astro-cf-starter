/** @jsxImportSource react */

import { act, cleanup, render, screen } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { CanvasProvider, useCanvas } from "../CanvasStore";
import type { Point, Rectangle, Square } from "../canvasTypes";
import StatsPanel from "../StatsPanel";

afterEach(() => {
	cleanup();
	localStorage.clear();
});

function AddShapes({ shapes }: { shapes: (Point | Rectangle | Square)[] }) {
	const { dispatch } = useCanvas();
	const added = useRef(false);
	useEffect(() => {
		if (added.current) return;
		added.current = true;
		for (const shape of shapes) {
			dispatch({ type: "ADD_SHAPE", shape });
		}
	}, [dispatch, shapes]);
	return null;
}

function ResizeShape({
	id,
	x1,
	y1,
	x2,
	y2,
}: {
	id: string;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}) {
	const { dispatch } = useCanvas();
	const resized = useRef(false);
	useEffect(() => {
		if (resized.current) return;
		resized.current = true;
		dispatch({ type: "RESIZE_SHAPE", id, x1, y1, x2, y2 });
	}, [dispatch, id, x1, y1, x2, y2]);
	return null;
}

function TestSetup({ shapes }: { shapes: (Point | Rectangle | Square)[] }) {
	return (
		<CanvasProvider>
			<StatsPanel />
			<AddShapes shapes={shapes} />
		</CanvasProvider>
	);
}

describe("StatsPanel", () => {
	it("shows 0 for all counts when empty", () => {
		render(
			<CanvasProvider>
				<StatsPanel />
			</CanvasProvider>,
		);
		expect(screen.getByText("Points: 0")).toBeDefined();
		expect(screen.getByText("Rectangles: 0")).toBeDefined();
		expect(screen.getByText("Squares: 0")).toBeDefined();
	});

	it("counts points correctly", () => {
		const shapes: Point[] = [
			{ id: "p1", type: "point", x: 10, y: 20, createdAt: 1 },
			{ id: "p2", type: "point", x: 30, y: 40, createdAt: 2 },
			{ id: "p3", type: "point", x: 50, y: 60, createdAt: 3 },
		];
		render(<TestSetup shapes={shapes} />);
		expect(screen.getByText("Points: 3")).toBeDefined();
		expect(screen.getByText("Rectangles: 0")).toBeDefined();
		expect(screen.getByText("Squares: 0")).toBeDefined();
	});

	it("counts rectangles (non-square) correctly", () => {
		const shapes: Rectangle[] = [
			{
				id: "r1",
				type: "rectangle",
				x1: 0,
				y1: 0,
				x2: 100,
				y2: 50,
				createdAt: 1,
			},
			{
				id: "r2",
				type: "rectangle",
				x1: 10,
				y1: 10,
				x2: 200,
				y2: 80,
				createdAt: 2,
			},
		];
		render(<TestSetup shapes={shapes} />);
		expect(screen.getByText("Points: 0")).toBeDefined();
		expect(screen.getByText("Rectangles: 2")).toBeDefined();
		expect(screen.getByText("Squares: 0")).toBeDefined();
	});

	it("counts squares (width === height) correctly", () => {
		const shapes: Rectangle[] = [
			{
				id: "s1",
				type: "rectangle",
				x1: 0,
				y1: 0,
				x2: 100,
				y2: 100,
				createdAt: 1,
			},
			{
				id: "s2",
				type: "rectangle",
				x1: 10,
				y1: 10,
				x2: 60,
				y2: 60,
				createdAt: 2,
			},
		];
		render(<TestSetup shapes={shapes} />);
		expect(screen.getByText("Points: 0")).toBeDefined();
		expect(screen.getByText("Rectangles: 0")).toBeDefined();
		expect(screen.getByText("Squares: 2")).toBeDefined();
	});

	it("counts mixed shapes correctly", () => {
		const shapes: (Point | Rectangle)[] = [
			{ id: "p1", type: "point", x: 10, y: 20, createdAt: 1 },
			{ id: "p2", type: "point", x: 30, y: 40, createdAt: 2 },
			{
				id: "r1",
				type: "rectangle",
				x1: 0,
				y1: 0,
				x2: 100,
				y2: 50,
				createdAt: 3,
			},
			{
				id: "s1",
				type: "rectangle",
				x1: 0,
				y1: 0,
				x2: 80,
				y2: 80,
				createdAt: 4,
			},
		];
		render(<TestSetup shapes={shapes} />);
		expect(screen.getByText("Points: 2")).toBeDefined();
		expect(screen.getByText("Rectangles: 1")).toBeDefined();
		expect(screen.getByText("Squares: 1")).toBeDefined();
	});

	it("counts squares with type='square' (created via Shift+drag) correctly", () => {
		const shapes: Square[] = [
			{
				id: "s1",
				type: "square",
				x1: 0,
				y1: 0,
				x2: 100,
				y2: 100,
				createdAt: 1,
			},
			{
				id: "s2",
				type: "square",
				x1: 10,
				y1: 10,
				x2: 60,
				y2: 60,
				createdAt: 2,
			},
		];
		render(<TestSetup shapes={shapes} />);
		expect(screen.getByText("Points: 0")).toBeDefined();
		expect(screen.getByText("Rectangles: 0")).toBeDefined();
		expect(screen.getByText("Squares: 2")).toBeDefined();
	});

	it("counts mixed types (point, rectangle, square) together", () => {
		const shapes: (Point | Rectangle | Square)[] = [
			{ id: "p1", type: "point", x: 10, y: 20, createdAt: 1 },
			{ id: "p2", type: "point", x: 30, y: 40, createdAt: 2 },
			{
				id: "r1",
				type: "rectangle",
				x1: 0,
				y1: 0,
				x2: 100,
				y2: 50,
				createdAt: 3,
			},
			{ id: "sq1", type: "square", x1: 0, y1: 0, x2: 80, y2: 80, createdAt: 4 },
		];
		render(<TestSetup shapes={shapes} />);
		expect(screen.getByText("Points: 2")).toBeDefined();
		expect(screen.getByText("Rectangles: 1")).toBeDefined();
		expect(screen.getByText("Squares: 1")).toBeDefined();
	});

	it("detects square by rounded dimensions", () => {
		const shapes: Rectangle[] = [
			{
				id: "r1",
				type: "rectangle",
				x1: 0,
				y1: 0,
				x2: 100.4,
				y2: 100.4,
				createdAt: 1,
			},
		];
		render(<TestSetup shapes={shapes} />);
		expect(screen.getByText("Squares: 1")).toBeDefined();
		expect(screen.getByText("Rectangles: 0")).toBeDefined();
	});

	it("counts rectangle as square after resize to equal dimensions", async () => {
		const rect: Rectangle = {
			id: "r1",
			type: "rectangle",
			x1: 0,
			y1: 0,
			x2: 200,
			y2: 100,
			createdAt: 1,
		};

		render(
			<CanvasProvider>
				<StatsPanel />
				<AddShapes shapes={[rect]} />
				<ResizeShape id="r1" x1={0} y1={0} x2={100} y2={100} />
			</CanvasProvider>,
		);

		await act(async () => {
			await new Promise((r) => setTimeout(r, 50));
		});

		expect(screen.getByText("Squares: 1")).toBeDefined();
		expect(screen.getByText("Rectangles: 0")).toBeDefined();
	});

	it("counts square as rectangle after resize to unequal dimensions", async () => {
		const rect: Rectangle = {
			id: "r1",
			type: "rectangle",
			x1: 0,
			y1: 0,
			x2: 100,
			y2: 100,
			createdAt: 1,
		};

		render(
			<CanvasProvider>
				<StatsPanel />
				<AddShapes shapes={[rect]} />
				<ResizeShape id="r1" x1={0} y1={0} x2={200} y2={100} />
			</CanvasProvider>,
		);

		await act(async () => {
			await new Promise((r) => setTimeout(r, 50));
		});

		expect(screen.getByText("Squares: 0")).toBeDefined();
		expect(screen.getByText("Rectangles: 1")).toBeDefined();
	});
});
