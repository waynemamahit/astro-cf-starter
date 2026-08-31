/** @jsxImportSource react */

import { act, render } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { CanvasProvider, useCanvas } from "../CanvasStore";
import type { Point, Rectangle } from "../canvasTypes";
import { STORAGE_KEY } from "../canvasTypes";

afterEach(() => {
	localStorage.clear();
});

function AddShape({ shape }: { shape: Point | Rectangle }) {
	const { dispatch } = useCanvas();
	const added = useRef(false);
	useEffect(() => {
		if (added.current) return;
		added.current = true;
		dispatch({ type: "ADD_SHAPE", shape });
	}, [dispatch, shape]);
	return null;
}

function StateReader({
	onState,
}: {
	onState: (shapes: (Point | Rectangle)[]) => void;
}) {
	const { state } = useCanvas();
	const rendered = useRef(false);
	useEffect(() => {
		if (!rendered.current) {
			rendered.current = true;
			onState(state.shapes as (Point | Rectangle)[]);
		}
	}, [state.shapes, onState]);
	return null;
}

describe("CanvasStore localStorage persistence", () => {
	it("saves shapes to localStorage on add", async () => {
		const point: Point = {
			id: "p1",
			type: "point",
			x: 10,
			y: 20,
			createdAt: 1,
		};

		render(
			<CanvasProvider>
				<AddShape shape={point} />
			</CanvasProvider>,
		);

		await act(async () => {
			await new Promise((r) => setTimeout(r, 10));
		});

		const stored = localStorage.getItem(STORAGE_KEY);
		expect(stored).toBeTruthy();
		const parsed = JSON.parse(stored ?? "{}");
		expect(parsed.shapes).toHaveLength(1);
		expect(parsed.shapes[0].id).toBe("p1");
	});

	it("restores shapes from localStorage on mount", () => {
		const existingShapes = [
			{ id: "p1", type: "point", x: 50, y: 60, createdAt: 1 },
			{
				id: "r1",
				type: "rectangle",
				x1: 0,
				y1: 0,
				x2: 100,
				y2: 50,
				createdAt: 2,
			},
		];
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ shapes: existingShapes }),
		);

		const captured: (Point | Rectangle)[] = [];
		render(
			<CanvasProvider>
				<StateReader onState={(s) => captured.push(...s)} />
			</CanvasProvider>,
		);

		expect(captured).toHaveLength(2);
		expect(captured[0].id).toBe("p1");
		expect(captured[1].id).toBe("r1");
	});

	it("returns initial state when localStorage is empty", () => {
		const captured: (Point | Rectangle)[] = [];
		render(
			<CanvasProvider>
				<StateReader onState={(s) => captured.push(...s)} />
			</CanvasProvider>,
		);

		expect(captured).toHaveLength(0);
	});

	it("returns initial state when localStorage has invalid JSON", () => {
		localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");

		const captured: (Point | Rectangle)[] = [];
		render(
			<CanvasProvider>
				<StateReader onState={(s) => captured.push(...s)} />
			</CanvasProvider>,
		);

		expect(captured).toHaveLength(0);
	});

	it("returns initial state when localStorage has missing shapes key", () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ other: "data" }));

		const captured: (Point | Rectangle)[] = [];
		render(
			<CanvasProvider>
				<StateReader onState={(s) => captured.push(...s)} />
			</CanvasProvider>,
		);

		expect(captured).toHaveLength(0);
	});

	it("persists shapes that can be restored in new provider", async () => {
		const point: Point = {
			id: "p1",
			type: "point",
			x: 10,
			y: 20,
			createdAt: 1,
		};

		const { unmount } = render(
			<CanvasProvider>
				<AddShape shape={point} />
			</CanvasProvider>,
		);

		await act(async () => {
			await new Promise((r) => setTimeout(r, 10));
		});

		unmount();

		const captured: (Point | Rectangle)[] = [];
		render(
			<CanvasProvider>
				<StateReader onState={(s) => captured.push(...s)} />
			</CanvasProvider>,
		);

		expect(captured).toHaveLength(1);
		expect(captured[0].id).toBe("p1");
	});
});
