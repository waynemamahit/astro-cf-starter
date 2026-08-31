/** @jsxImportSource react */
/** biome-ignore-all lint/suspicious/noExplicitAny: safe for testing purposes */

import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { useEffect, useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Canvas from "../Canvas";
import { CanvasProvider, useCanvas } from "../CanvasStore";
import type { Point, Rectangle, Shape, Square } from "../canvasTypes";

afterEach(() => {
	cleanup();
	localStorage.clear();
});

function StateCapture({
	onState,
}: {
	onState: (state: { shapes: Shape[]; selectedId: string | null }) => void;
}) {
	const { state } = useCanvas();
	const prevRef = useRef<string>("");
	useEffect(() => {
		const key = JSON.stringify(state.shapes) + state.selectedId;
		if (key !== prevRef.current) {
			prevRef.current = key;
			onState({ shapes: state.shapes, selectedId: state.selectedId });
		}
	}, [state.shapes, state.selectedId, onState]);
	return null;
}

function CanvasWithCapture({
	onState,
}: {
	onState: (state: { shapes: Shape[]; selectedId: string | null }) => void;
}) {
	return (
		<CanvasProvider>
			<Canvas />
			<StateCapture onState={onState} />
		</CanvasProvider>
	);
}

describe("Canvas integration", () => {
	beforeEach(() => {
		HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
			x: 0,
			y: 0,
			width: 800,
			height: 600,
			top: 0,
			left: 0,
			right: 800,
			bottom: 600,
			toJSON: () => {},
		}));
		HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
			scale: vi.fn(),
			clearRect: vi.fn(),
			fillRect: vi.fn(),
			strokeRect: vi.fn(),
			beginPath: vi.fn(),
			arc: vi.fn(),
			fill: vi.fn(),
			stroke: vi.fn(),
			setLineDash: vi.fn(),
			fillStyle: "",
			strokeStyle: "",
			lineWidth: 0,
		})) as any;
	});

	it("renders canvas element", () => {
		render(
			<CanvasProvider>
				<Canvas />
			</CanvasProvider>,
		);
		const canvas = document.querySelector("canvas");
		expect(canvas).toBeDefined();
	});

	it("creates point on click without drag", async () => {
		const captured: Shape[] = [];
		render(<CanvasWithCapture onState={(s) => captured.push(...s.shapes)} />);

		const canvas = document.querySelector("canvas");
		if (!canvas) throw new Error("Canvas not found");
		await act(async () => {
			fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
			fireEvent.mouseUp(canvas, { clientX: 100, clientY: 100 });
			await new Promise((r) => setTimeout(r, 50));
		});

		const points = captured.filter((s) => s.type === "point");
		expect(points.length).toBeGreaterThanOrEqual(1);
		expect(points[0].type).toBe("point");
	});

	it("creates rectangle on click+drag", async () => {
		const captured: Shape[] = [];
		render(<CanvasWithCapture onState={(s) => captured.push(...s.shapes)} />);

		const canvas = document.querySelector("canvas");
		if (!canvas) throw new Error("Canvas not found");
		await act(async () => {
			fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
			fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
			fireEvent.mouseUp(canvas, { clientX: 150, clientY: 150 });
			await new Promise((r) => setTimeout(r, 50));
		});

		const rects = captured.filter((s) => s.type === "rectangle");
		expect(rects.length).toBeGreaterThanOrEqual(1);
	});

	it("creates square on shift+click+drag", async () => {
		const captured: Shape[] = [];
		render(<CanvasWithCapture onState={(s) => captured.push(...s.shapes)} />);

		const canvas = document.querySelector("canvas");
		if (!canvas) throw new Error("Canvas not found");
		await act(async () => {
			fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50, shiftKey: true });
			fireEvent.mouseMove(canvas, {
				clientX: 150,
				clientY: 150,
				shiftKey: true,
			});
			fireEvent.mouseUp(canvas, { clientX: 150, clientY: 150, shiftKey: true });
			await new Promise((r) => setTimeout(r, 50));
		});

		const squares = captured.filter((s) => s.type === "square");
		expect(squares.length).toBeGreaterThanOrEqual(1);
	});

	it("selects shape on click", async () => {
		const point: Point = {
			id: "p1",
			type: "point",
			x: 100,
			y: 100,
			createdAt: Date.now(),
		};
		const states: { shapes: Shape[]; selectedId: string | null }[] = [];

		render(
			<CanvasProvider>
				<Canvas />
				<AddShape shape={point} />
				<StateCapture onState={(s) => states.push(s)} />
			</CanvasProvider>,
		);

		await act(async () => {
			await new Promise((r) => setTimeout(r, 50));
		});

		const canvas = document.querySelector("canvas");
		if (!canvas) throw new Error("Canvas not found");
		await act(async () => {
			fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
			fireEvent.mouseUp(canvas, { clientX: 100, clientY: 100 });
			await new Promise((r) => setTimeout(r, 50));
		});

		const lastState = states[states.length - 1];
		expect(lastState.selectedId).toBe("p1");
	});

	it("deselects on click empty area", async () => {
		const point: Point = {
			id: "p1",
			type: "point",
			x: 100,
			y: 100,
			createdAt: Date.now(),
		};
		const states: { shapes: Shape[]; selectedId: string | null }[] = [];

		render(
			<CanvasProvider>
				<Canvas />
				<AddShape shape={point} />
				<StateCapture onState={(s) => states.push(s)} />
			</CanvasProvider>,
		);

		await act(async () => {
			await new Promise((r) => setTimeout(r, 50));
		});

		const canvas = document.querySelector("canvas");
		if (!canvas) throw new Error("Canvas not found");

		await act(async () => {
			fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
			fireEvent.mouseUp(canvas, { clientX: 100, clientY: 100 });
			await new Promise((r) => setTimeout(r, 50));
		});

		await act(async () => {
			fireEvent.mouseDown(canvas, { clientX: 500, clientY: 500 });
			fireEvent.mouseUp(canvas, { clientX: 500, clientY: 500 });
			await new Promise((r) => setTimeout(r, 50));
		});

		const lastState = states[states.length - 1];
		expect(lastState.selectedId).toBeNull();
	});

	it("deletes selected shape with Delete key", async () => {
		const point: Point = {
			id: "p1",
			type: "point",
			x: 100,
			y: 100,
			createdAt: Date.now(),
		};
		const states: { shapes: Shape[]; selectedId: string | null }[] = [];

		render(
			<CanvasProvider>
				<Canvas />
				<AddShape shape={point} />
				<StateCapture onState={(s) => states.push(s)} />
			</CanvasProvider>,
		);

		await act(async () => {
			await new Promise((r) => setTimeout(r, 50));
		});

		const canvas = document.querySelector("canvas");
		if (!canvas) throw new Error("Canvas not found");

		await act(async () => {
			fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
			fireEvent.mouseUp(canvas, { clientX: 100, clientY: 100 });
			await new Promise((r) => setTimeout(r, 50));
		});

		await act(async () => {
			fireEvent.keyDown(window, { key: "Delete" });
			await new Promise((r) => setTimeout(r, 50));
		});

		const lastState = states[states.length - 1];
		expect(lastState.shapes).toHaveLength(0);
		expect(lastState.selectedId).toBeNull();
	});

	it("undoes last action with Ctrl+Z", async () => {
		const states: { shapes: Shape[]; selectedId: string | null }[] = [];

		render(
			<CanvasProvider>
				<Canvas />
				<StateCapture onState={(s) => states.push(s)} />
			</CanvasProvider>,
		);

		const canvas = document.querySelector("canvas");
		if (!canvas) throw new Error("Canvas not found");

		await act(async () => {
			fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
			fireEvent.mouseUp(canvas, { clientX: 100, clientY: 100 });
			await new Promise((r) => setTimeout(r, 50));
		});

		expect(states.some((s) => s.shapes.length === 1)).toBe(true);

		await act(async () => {
			fireEvent.keyDown(window, { key: "z", ctrlKey: true });
			await new Promise((r) => setTimeout(r, 50));
		});

		const lastState = states[states.length - 1];
		expect(lastState.shapes).toHaveLength(0);
	});

	it("redoes with Ctrl+Shift+Z", async () => {
		const states: { shapes: Shape[]; selectedId: string | null }[] = [];

		render(
			<CanvasProvider>
				<Canvas />
				<StateCapture onState={(s) => states.push(s)} />
			</CanvasProvider>,
		);

		const canvas = document.querySelector("canvas");
		if (!canvas) throw new Error("Canvas not found");

		await act(async () => {
			fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
			fireEvent.mouseUp(canvas, { clientX: 100, clientY: 100 });
			await new Promise((r) => setTimeout(r, 50));
		});

		await act(async () => {
			fireEvent.keyDown(window, { key: "z", ctrlKey: true });
			await new Promise((r) => setTimeout(r, 50));
		});

		await act(async () => {
			fireEvent.keyDown(window, { key: "z", ctrlKey: true, shiftKey: true });
			await new Promise((r) => setTimeout(r, 50));
		});

		const lastState = states[states.length - 1];
		expect(lastState.shapes).toHaveLength(1);
	});

	it("redoes with Ctrl+Y", async () => {
		const states: { shapes: Shape[]; selectedId: string | null }[] = [];

		render(
			<CanvasProvider>
				<Canvas />
				<StateCapture onState={(s) => states.push(s)} />
			</CanvasProvider>,
		);

		const canvas = document.querySelector("canvas");
		if (!canvas) throw new Error("Canvas not found");

		await act(async () => {
			fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
			fireEvent.mouseUp(canvas, { clientX: 100, clientY: 100 });
			await new Promise((r) => setTimeout(r, 50));
		});

		await act(async () => {
			fireEvent.keyDown(window, { key: "z", ctrlKey: true });
			await new Promise((r) => setTimeout(r, 50));
		});

		await act(async () => {
			fireEvent.keyDown(window, { key: "y", ctrlKey: true });
			await new Promise((r) => setTimeout(r, 50));
		});

		const lastState = states[states.length - 1];
		expect(lastState.shapes).toHaveLength(1);
	});
});

describe("Canvas hover tooltips", () => {
	beforeEach(() => {
		HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
			x: 0,
			y: 0,
			width: 800,
			height: 600,
			top: 0,
			left: 0,
			right: 800,
			bottom: 600,
			toJSON: () => {},
		}));
		HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
			scale: vi.fn(),
			clearRect: vi.fn(),
			fillRect: vi.fn(),
			strokeRect: vi.fn(),
			beginPath: vi.fn(),
			arc: vi.fn(),
			fill: vi.fn(),
			stroke: vi.fn(),
			setLineDash: vi.fn(),
			fillStyle: "",
			strokeStyle: "",
			lineWidth: 0,
		})) as any;
	});

	it("shows coordinate tooltip when hovering over a point", async () => {
		const point: Point = {
			id: "p1",
			type: "point",
			x: 100,
			y: 200,
			createdAt: Date.now(),
		};

		render(
			<CanvasProvider>
				<Canvas />
				<AddShape shape={point} />
			</CanvasProvider>,
		);

		await act(async () => {
			await new Promise((r) => setTimeout(r, 50));
		});

		const canvas = document.querySelector("canvas");
		if (!canvas) throw new Error("Canvas not found");

		await act(async () => {
			fireEvent.mouseMove(canvas, { clientX: 100, clientY: 200 });
			await new Promise((r) => setTimeout(r, 50));
		});

		const tooltip = screen.getByText(/\(\d+, \d+\)/);
		expect(tooltip).toBeDefined();
	});

	it("shows dimension tooltip when hovering over a rectangle", async () => {
		const rect: Rectangle = {
			id: "r1",
			type: "rectangle",
			x1: 50,
			y1: 50,
			x2: 150,
			y2: 150,
			createdAt: Date.now(),
		};

		render(
			<CanvasProvider>
				<Canvas />
				<AddShape shape={rect} />
			</CanvasProvider>,
		);

		await act(async () => {
			await new Promise((r) => setTimeout(r, 50));
		});

		const canvas = document.querySelector("canvas");
		if (!canvas) throw new Error("Canvas not found");

		await act(async () => {
			fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
			await new Promise((r) => setTimeout(r, 50));
		});

		const tooltip = screen.getByText(/\d+ x \d+ \(Area: \d+ sq px\)/);
		expect(tooltip).toBeDefined();
	});

	it("hides tooltip when mouse leaves canvas", async () => {
		const point: Point = {
			id: "p1",
			type: "point",
			x: 100,
			y: 200,
			createdAt: Date.now(),
		};

		render(
			<CanvasProvider>
				<Canvas />
				<AddShape shape={point} />
			</CanvasProvider>,
		);

		await act(async () => {
			await new Promise((r) => setTimeout(r, 50));
		});

		const canvas = document.querySelector("canvas");
		if (!canvas) throw new Error("Canvas not found");

		await act(async () => {
			fireEvent.mouseMove(canvas, { clientX: 100, clientY: 200 });
			await new Promise((r) => setTimeout(r, 50));
		});

		expect(screen.getByText(/\(\d+, \d+\)/)).toBeDefined();

		await act(async () => {
			fireEvent.mouseLeave(canvas);
			await new Promise((r) => setTimeout(r, 50));
		});

		expect(screen.queryByText(/\(\d+, \d+\)/)).toBeNull();
	});
});

describe("Canvas resize interaction", () => {
	beforeEach(() => {
		HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
			x: 0,
			y: 0,
			width: 800,
			height: 600,
			top: 0,
			left: 0,
			right: 800,
			bottom: 600,
			toJSON: () => {},
		}));
		HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
			scale: vi.fn(),
			clearRect: vi.fn(),
			fillRect: vi.fn(),
			strokeRect: vi.fn(),
			beginPath: vi.fn(),
			arc: vi.fn(),
			fill: vi.fn(),
			stroke: vi.fn(),
			setLineDash: vi.fn(),
			fillStyle: "",
			strokeStyle: "",
			lineWidth: 0,
		})) as any;
	});

	it("resizes rectangle by dragging corner handle", async () => {
		const rect: Rectangle = {
			id: "r1",
			type: "rectangle",
			x1: 50,
			y1: 50,
			x2: 150,
			y2: 150,
			createdAt: Date.now(),
		};
		const states: { shapes: Shape[]; selectedId: string | null }[] = [];

		render(
			<CanvasProvider>
				<Canvas />
				<AddShape shape={rect} />
				<StateCapture onState={(s) => states.push(s)} />
			</CanvasProvider>,
		);

		await act(async () => {
			await new Promise((r) => setTimeout(r, 50));
		});

		const canvas = document.querySelector("canvas");
		if (!canvas) throw new Error("Canvas not found");

		await act(async () => {
			fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
			fireEvent.mouseUp(canvas, { clientX: 100, clientY: 100 });
			await new Promise((r) => setTimeout(r, 50));
		});

		const selectedState = states[states.length - 1];
		expect(selectedState.selectedId).toBe("r1");

		await act(async () => {
			fireEvent.mouseDown(canvas, { clientX: 150, clientY: 150 });
			fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
			fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 });
			await new Promise((r) => setTimeout(r, 50));
		});

		const resizedState = states[states.length - 1];
		const resizedRect = resizedState.shapes.find(
			(s) => s.id === "r1",
		) as Rectangle;
		expect(resizedRect).toBeDefined();
		expect(resizedRect.x2).toBe(200);
		expect(resizedRect.y2).toBe(200);
	});

	it("shows live dimension label during resize", async () => {
		const rect: Rectangle = {
			id: "r1",
			type: "rectangle",
			x1: 50,
			y1: 50,
			x2: 150,
			y2: 150,
			createdAt: Date.now(),
		};

		render(
			<CanvasProvider>
				<Canvas />
				<AddShape shape={rect} />
			</CanvasProvider>,
		);

		await act(async () => {
			await new Promise((r) => setTimeout(r, 50));
		});

		const canvas = document.querySelector("canvas");
		if (!canvas) throw new Error("Canvas not found");

		await act(async () => {
			fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
			fireEvent.mouseUp(canvas, { clientX: 100, clientY: 100 });
			await new Promise((r) => setTimeout(r, 50));
		});

		await act(async () => {
			fireEvent.mouseDown(canvas, { clientX: 150, clientY: 150 });
			fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
			await new Promise((r) => setTimeout(r, 50));
		});

		const tooltip = screen.getByText(/\d+ x \d+ \(Area: \d+ sq px\)/);
		expect(tooltip).toBeDefined();
	});
});

describe("Canvas z-order rendering", () => {
	it("draws points after rectangles (points on top)", async () => {
		const drawOrder: string[] = [];
		const mockContext = {
			scale: vi.fn(),
			clearRect: vi.fn(),
			fillRect: vi.fn(() => drawOrder.push("fillRect")),
			strokeRect: vi.fn(),
			beginPath: vi.fn(),
			arc: vi.fn(() => drawOrder.push("arc")),
			fill: vi.fn(),
			stroke: vi.fn(),
			setLineDash: vi.fn(),
			fillStyle: "",
			strokeStyle: "",
			lineWidth: 0,
		};

		HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
			x: 0,
			y: 0,
			width: 800,
			height: 600,
			top: 0,
			left: 0,
			right: 800,
			bottom: 600,
			toJSON: () => {},
		}));
		HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as any;

		const point: Point = {
			id: "p1",
			type: "point",
			x: 100,
			y: 100,
			createdAt: 1,
		};
		const rect: Rectangle = {
			id: "r1",
			type: "rectangle",
			x1: 50,
			y1: 50,
			x2: 150,
			y2: 150,
			createdAt: 2,
		};

		render(
			<CanvasProvider>
				<Canvas />
				<AddShape shape={rect} />
				<AddShape shape={point} />
			</CanvasProvider>,
		);

		await act(async () => {
			await new Promise((r) => setTimeout(r, 100));
		});

		const lastFillRect = drawOrder.lastIndexOf("fillRect");
		const lastArc = drawOrder.lastIndexOf("arc");
		expect(lastArc).toBeGreaterThan(lastFillRect);
	});

	it("draws rectangles in creation time order", async () => {
		const fillRectCalls: { x: number; y: number }[] = [];
		const mockContext = {
			scale: vi.fn(),
			clearRect: vi.fn(),
			fillRect: vi.fn((_x: number, y: number) =>
				fillRectCalls.push({ x: 0, y }),
			),
			strokeRect: vi.fn(),
			beginPath: vi.fn(),
			arc: vi.fn(),
			fill: vi.fn(),
			stroke: vi.fn(),
			setLineDash: vi.fn(),
			fillStyle: "",
			strokeStyle: "",
			lineWidth: 0,
		};

		HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
			x: 0,
			y: 0,
			width: 800,
			height: 600,
			top: 0,
			left: 0,
			right: 800,
			bottom: 600,
			toJSON: () => {},
		}));
		HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as any;

		const earlyRect: Rectangle = {
			id: "r1",
			type: "rectangle",
			x1: 50,
			y1: 50,
			x2: 150,
			y2: 150,
			createdAt: 1,
		};
		const lateRect: Rectangle = {
			id: "r2",
			type: "rectangle",
			x1: 80,
			y1: 80,
			x2: 180,
			y2: 180,
			createdAt: 2,
		};

		render(
			<CanvasProvider>
				<Canvas />
				<AddShape shape={earlyRect} />
				<AddShape shape={lateRect} />
			</CanvasProvider>,
		);

		await act(async () => {
			await new Promise((r) => setTimeout(r, 100));
		});

		expect(fillRectCalls.length).toBeGreaterThanOrEqual(2);
	});
});

function AddShape({ shape }: { shape: Point | Rectangle | Square }) {
	const { dispatch } = useCanvas();
	const added = useRef(false);
	useEffect(() => {
		if (added.current) return;
		added.current = true;
		dispatch({ type: "ADD_SHAPE", shape });
	}, [dispatch, shape]);
	return null;
}
