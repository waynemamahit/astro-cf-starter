/** @jsxImportSource react */
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useReducer,
	useRef,
} from "react";
import { canvasReducer, initialState } from "./canvasReducer";
import type {
	CanvasAction,
	CanvasState,
	Rectangle,
	Shape,
	Square,
} from "./canvasTypes";
import { STORAGE_KEY } from "./canvasTypes";
import { getRect } from "./canvasUtils";

const POINT_RADIUS = 4;

function renderToOffscreen(
	shapes: Shape[],
	width = 1920,
	height = 1080,
): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Context not found");

	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, width, height);

	const rects = shapes.filter(
		(s) => s.type === "rectangle" || s.type === "square",
	) as (Rectangle | Square)[];
	const points = shapes.filter((s) => s.type === "point");

	rects.sort((a, b) => a.createdAt - b.createdAt);

	for (const r of rects) {
		const { x, y, w, h } = getRect(r);
		ctx.fillStyle = "#e0e7ff";
		ctx.strokeStyle = "#6366f1";
		ctx.lineWidth = 2;
		ctx.fillRect(x, y, w, h);
		ctx.strokeRect(x, y, w, h);
	}

	for (const p of points) {
		ctx.beginPath();
		ctx.arc(p.x, p.y, POINT_RADIUS, 0, Math.PI * 2);
		ctx.fillStyle = "#6366f1";
		ctx.fill();
	}

	return canvas;
}

interface CanvasContextValue {
	state: CanvasState;
	dispatch: React.Dispatch<CanvasAction>;
	renderClean: (sourceCanvas?: HTMLCanvasElement) => HTMLCanvasElement;
	canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

function loadState(): CanvasState {
	if (typeof window === "undefined") return initialState;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return initialState;
		const parsed = JSON.parse(raw);
		if (!parsed.shapes || !Array.isArray(parsed.shapes)) return initialState;
		return {
			...initialState,
			shapes: parsed.shapes,
			history: [parsed.shapes],
			historyIndex: 0,
		};
	} catch {
		return initialState;
	}
}

export function CanvasProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(canvasReducer, null, loadState);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ shapes: state.shapes }),
			);
		} catch {
			// localStorage full or unavailable
		}
	}, [state.shapes]);

	useEffect(() => {
		document.documentElement.dataset.canvasReady = "true";
	}, []);

	const renderClean = useCallback(
		(sourceCanvas?: HTMLCanvasElement) => {
			const w = sourceCanvas?.width ?? 1920;
			const h = sourceCanvas?.height ?? 1080;
			return renderToOffscreen(state.shapes, w, h);
		},
		[state.shapes],
	);

	return (
		<CanvasContext.Provider value={{ state, dispatch, renderClean, canvasRef }}>
			{children}
		</CanvasContext.Provider>
	);
}

export function useCanvas(): CanvasContextValue {
	const ctx = useContext(CanvasContext);
	if (!ctx) throw new Error("useCanvas must be used within CanvasProvider");
	return ctx;
}
