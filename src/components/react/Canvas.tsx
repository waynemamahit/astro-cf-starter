/** @jsxImportSource react */
import { useCallback, useEffect, useRef, useState } from "react";
import { useCanvas } from "./CanvasStore";
import type { Rectangle, Shape, Square } from "./canvasTypes";
import { getRect, pointInRect } from "./canvasUtils";

const POINT_RADIUS = 4;
const CORNER_SIZE = 8;
const MIN_DRAG = 3;

function pointNearPoint(px: number, py: number, sx: number, sy: number) {
	return Math.hypot(px - sx, py - sy) <= POINT_RADIUS + 4;
}

function getCorners(r: Rectangle | Square) {
	return [
		{ x: r.x1, y: r.y1 },
		{ x: r.x2, y: r.y1 },
		{ x: r.x2, y: r.y2 },
		{ x: r.x1, y: r.y2 },
	];
}

function hitCorner(px: number, py: number, r: Rectangle | Square): number | -1 {
	const corners = getCorners(r);
	for (let i = 0; i < corners.length; i++) {
		if (
			Math.abs(px - corners[i].x) <= CORNER_SIZE &&
			Math.abs(py - corners[i].y) <= CORNER_SIZE
		) {
			return i;
		}
	}
	return -1;
}

function oppositeCorner(idx: number): number {
	return (idx + 2) % 4;
}

function getOpposite(r: Rectangle | Square, cornerIdx: number) {
	const corners = getCorners(r);
	return corners[oppositeCorner(cornerIdx)];
}

function hitTest(px: number, py: number, shapes: Shape[]): Shape | null {
	for (let i = shapes.length - 1; i >= 0; i--) {
		const s = shapes[i];
		if (s.type === "point" && pointNearPoint(px, py, s.x, s.y)) return s;
	}
	for (let i = shapes.length - 1; i >= 0; i--) {
		const s = shapes[i];
		if (s.type !== "point" && pointInRect(px, py, s)) return s;
	}
	return null;
}

function getCornerHit(
	px: number,
	py: number,
	shapes: Shape[],
): { shape: Rectangle | Square; corner: number } | null {
	for (let i = shapes.length - 1; i >= 0; i--) {
		const s = shapes[i];
		if (s.type === "rectangle" || s.type === "square") {
			const c = hitCorner(px, py, s);
			if (c !== -1) return { shape: s, corner: c };
		}
	}
	return null;
}

let nextId = 1;
function genId() {
	return `shape-${Date.now()}-${nextId++}`;
}

function clampHoverPos(
	x: number,
	y: number,
	text: string,
	canvas: HTMLCanvasElement | null,
	offsetX = 15,
	offsetY = -10,
): { x: number; y: number; text: string } {
	let hx = x + offsetX;
	let hy = y + offsetY;
	if (canvas) {
		const rect = canvas.getBoundingClientRect();
		const labelW = 200;
		const labelH = 24;
		hx = Math.max(4, Math.min(hx, rect.width - labelW - 4));
		hy = Math.max(4, Math.min(hy, rect.height - labelH - 4));
	}
	return { x: hx, y: hy, text };
}

export default function Canvas() {
	const { state, dispatch, canvasRef: ctxCanvasRef } = useCanvas();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [hover, setHover] = useState<{
		x: number;
		y: number;
		text: string;
	} | null>(null);

	const interactionRef = useRef<{
		mode: "idle" | "creating-rect" | "moving" | "resizing";
		startX: number;
		startY: number;
		shapeId?: string;
		cornerIdx?: number;
		opposite?: { x: number; y: number };
		hasDragged: boolean;
	}>({ mode: "idle", startX: 0, startY: 0, hasDragged: false });

	const render = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);

		ctx.clearRect(0, 0, rect.width, rect.height);
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, rect.width, rect.height);

		const rects = state.shapes.filter(
			(s) => s.type === "rectangle" || s.type === "square",
		) as (Rectangle | Square)[];
		const points = state.shapes.filter((s) => s.type === "point");

		rects.sort((a, b) => a.createdAt - b.createdAt);

		for (const r of rects) {
			const { x, y, w, h } = getRect(r);
			ctx.fillStyle = state.selectedId === r.id ? "#dbeafe" : "#e0e7ff";
			ctx.strokeStyle = state.selectedId === r.id ? "#2563eb" : "#6366f1";
			ctx.lineWidth = 2;
			ctx.fillRect(x, y, w, h);
			ctx.strokeRect(x, y, w, h);

			if (state.selectedId === r.id) {
				const corners = getCorners(r);
				for (const c of corners) {
					ctx.fillStyle = "#ffffff";
					ctx.strokeStyle = "#2563eb";
					ctx.lineWidth = 2;
					ctx.fillRect(
						c.x - CORNER_SIZE / 2,
						c.y - CORNER_SIZE / 2,
						CORNER_SIZE,
						CORNER_SIZE,
					);
					ctx.strokeRect(
						c.x - CORNER_SIZE / 2,
						c.y - CORNER_SIZE / 2,
						CORNER_SIZE,
						CORNER_SIZE,
					);
				}
			}
		}

		for (const p of points) {
			ctx.beginPath();
			ctx.arc(p.x, p.y, POINT_RADIUS, 0, Math.PI * 2);
			ctx.fillStyle = state.selectedId === p.id ? "#2563eb" : "#6366f1";
			ctx.fill();
			if (state.selectedId === p.id) {
				ctx.strokeStyle = "#ffffff";
				ctx.lineWidth = 2;
				ctx.stroke();
			}
		}
	}, [state.shapes, state.selectedId]);

	const renderRef = useRef(render);
	renderRef.current = render;

	// biome-ignore lint/correctness/useExhaustiveDependencies: we want to render when the shapes or selectedId change
	useEffect(() => {
		renderRef.current();
	}, [state.shapes, state.selectedId]);

	useEffect(() => {
		ctxCanvasRef.current = canvasRef.current;
		return () => {
			ctxCanvasRef.current = null;
		};
	}, [ctxCanvasRef]);

	useEffect(() => {
		const handleResize = () => renderRef.current();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Delete" && state.selectedId) {
				dispatch({ type: "DELETE_SHAPE", id: state.selectedId });
			}
			if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
				e.preventDefault();
				dispatch({ type: "UNDO" });
			}
			if (
				(e.ctrlKey || e.metaKey) &&
				(e.key === "y" || (e.key === "z" && e.shiftKey))
			) {
				e.preventDefault();
				dispatch({ type: "REDO" });
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [state.selectedId, dispatch]);

	const getCanvasPos = (e: React.MouseEvent) => {
		const canvas = canvasRef.current;
		if (!canvas) throw new Error("Canvas not found");
		const r = canvas.getBoundingClientRect();
		return { x: e.clientX - r.left, y: e.clientY - r.top };
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		const { x, y } = getCanvasPos(e);
		const inter = interactionRef.current;
		inter.hasDragged = false;

		const cornerHit = getCornerHit(x, y, state.shapes);
		if (cornerHit && state.selectedId === cornerHit.shape.id) {
			inter.mode = "resizing";
			inter.startX = x;
			inter.startY = y;
			inter.shapeId = cornerHit.shape.id;
			inter.cornerIdx = cornerHit.corner;
			inter.opposite = getOpposite(cornerHit.shape, cornerHit.corner);
			return;
		}

		const hit = hitTest(x, y, state.shapes);
		if (hit && hit.type !== "point") {
			dispatch({ type: "SELECT_SHAPE", id: hit.id });
			inter.mode = "moving";
			inter.startX = x;
			inter.startY = y;
			inter.shapeId = hit.id;
			return;
		}

		if (hit && hit.type === "point") {
			dispatch({ type: "SELECT_SHAPE", id: hit.id });
			return;
		}

		inter.mode = "creating-rect";
		inter.startX = x;
		inter.startY = y;
		dispatch({ type: "DESELECT" });
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		const { x, y } = getCanvasPos(e);
		const inter = interactionRef.current;

		if (inter.mode === "idle") {
			const hit = hitTest(x, y, state.shapes);
			if (hit) {
				let text = "";
				if (hit.type === "point") {
					text = `(${Math.round(hit.x)}, ${Math.round(hit.y)})`;
				} else {
					const { w, h } = getRect(hit);
					text = `${Math.round(w)} x ${Math.round(h)} (Area: ${Math.round(w * h)} sq px)`;
				}
				setHover(clampHoverPos(x, y, text, canvasRef.current));
			} else {
				setHover(null);
			}
			return;
		}

		inter.hasDragged = true;

		if (inter.mode === "creating-rect") {
			const shift = e.shiftKey;
			let dx = x - inter.startX;
			let dy = y - inter.startY;
			if (shift) {
				const size = Math.max(Math.abs(dx), Math.abs(dy));
				dx = Math.sign(dx) * size;
				dy = Math.sign(dy) * size;
			}
			const tempRect: Rectangle | Square = {
				id: "__temp__",
				type: shift ? "square" : "rectangle",
				x1: inter.startX,
				y1: inter.startY,
				x2: inter.startX + dx,
				y2: inter.startY + dy,
				createdAt: 0,
			};
			const canvas = canvasRef.current;
			if (!canvas) throw new Error("Canvas not found");
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("Context not found");
			const cr = canvas.getBoundingClientRect();
			ctx.clearRect(0, 0, cr.width, cr.height);
			render();
			const { x: rx, y: ry, w, h } = getRect(tempRect);
			ctx.fillStyle = "rgba(99,102,241,0.15)";
			ctx.strokeStyle = "#6366f1";
			ctx.lineWidth = 2;
			ctx.setLineDash([6, 4]);
			ctx.fillRect(rx, ry, w, h);
			ctx.strokeRect(rx, ry, w, h);
			ctx.setLineDash([]);
		}

		if (inter.mode === "moving" && inter.shapeId) {
			dispatch({
				type: "MOVE_SHAPE",
				id: inter.shapeId,
				dx: x - inter.startX,
				dy: y - inter.startY,
			});
			inter.startX = x;
			inter.startY = y;
		}

		if (inter.mode === "resizing" && inter.shapeId && inter.opposite) {
			let rx = x;
			let ry = y;
			if (e.shiftKey) {
				const dw = Math.abs(rx - inter.opposite.x);
				const dh = Math.abs(ry - inter.opposite.y);
				const size = Math.max(dw, dh);
				const sx = rx >= inter.opposite.x ? 1 : -1;
				const sy = ry >= inter.opposite.y ? 1 : -1;
				rx = inter.opposite.x + sx * size;
				ry = inter.opposite.y + sy * size;
			}
			dispatch({
				type: "RESIZE_SHAPE",
				id: inter.shapeId,
				x1: inter.opposite.x,
				y1: inter.opposite.y,
				x2: rx,
				y2: ry,
			});
			const w = Math.abs(x - inter.opposite.x);
			const h = Math.abs(y - inter.opposite.y);
			setHover(
				clampHoverPos(
					x,
					y,
					`${Math.round(w)} x ${Math.round(h)} (Area: ${Math.round(w * h)} sq px)`,
					canvasRef.current,
				),
			);
		}
	};

	const handleMouseUp = (e: React.MouseEvent) => {
		const { x, y } = getCanvasPos(e);
		const inter = interactionRef.current;

		if (inter.mode === "creating-rect" && inter.hasDragged) {
			const shift = e.shiftKey;
			let dx = x - inter.startX;
			let dy = y - inter.startY;
			if (shift) {
				const size = Math.max(Math.abs(dx), Math.abs(dy));
				dx = Math.sign(dx) * size;
				dy = Math.sign(dy) * size;
			}
			const w = Math.abs(dx);
			const h = Math.abs(dy);
			if (w > MIN_DRAG || h > MIN_DRAG) {
				dispatch({
					type: "ADD_SHAPE",
					shape: {
						id: genId(),
						type: shift ? "square" : "rectangle",
						x1: inter.startX,
						y1: inter.startY,
						x2: inter.startX + dx,
						y2: inter.startY + dy,
						createdAt: Date.now(),
					},
				});
			}
		}

		if (inter.mode === "creating-rect" && !inter.hasDragged) {
			dispatch({
				type: "ADD_SHAPE",
				shape: {
					id: genId(),
					type: "point",
					x,
					y,
					createdAt: Date.now(),
				},
			});
		}

		inter.mode = "idle";
		inter.shapeId = undefined;
		inter.cornerIdx = undefined;
		inter.opposite = undefined;
		inter.hasDragged = false;
	};

	return (
		<div
			ref={containerRef}
			className="relative w-full"
			style={{ minHeight: 500 }}
		>
			<canvas
				ref={canvasRef}
				className="w-full cursor-crosshair"
				style={{ height: "70vh", minHeight: 500, cursor: "crosshair" }}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={() => setHover(null)}
			/>
			{hover && (
				<div
					className="pointer-events-none absolute z-10 rounded bg-base-300 px-2 py-1 text-xs shadow"
					style={{ left: hover.x, top: hover.y }}
				>
					{hover.text}
				</div>
			)}
		</div>
	);
}
