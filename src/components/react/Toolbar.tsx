/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import { useCanvas } from "./CanvasStore";
import type { Rectangle, Shape, Square } from "./canvasTypes";
import { getRect } from "./canvasUtils";

export function getSvgExport(
	shapes: Shape[],
	width: number,
	height: number,
): string {
	const rects = shapes.filter(
		(s) => s.type === "rectangle" || s.type === "square",
	) as (Rectangle | Square)[];
	const points = shapes.filter((s) => s.type === "point");

	let svgContent = "";
	for (const r of rects) {
		const { x, y, w, h } = getRect(r);
		svgContent += `  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e0e7ff" stroke="#6366f1" stroke-width="2"/>\n`;
	}
	for (const p of points) {
		svgContent += `  <circle cx="${p.x}" cy="${p.y}" r="4" fill="#6366f1"/>\n`;
	}

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n${svgContent}</svg>`;
}

function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

function downloadText(text: string, filename: string, mime: string) {
	const blob = new Blob([text], { type: mime });
	downloadBlob(blob, filename);
}

export default function Toolbar() {
	const { state, dispatch, renderClean, canvasRef } = useCanvas();
	const [exportOpen, setExportOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const canUndo = state.historyIndex > 0;
	const canRedo = state.historyIndex < state.history.length - 1;

	useEffect(() => {
		if (!exportOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setExportOpen(false);
			}
		};
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") setExportOpen(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [exportOpen]);

	const handleExport = (format: "png" | "jpg" | "svg") => {
		setExportOpen(false);
		const canvas = canvasRef.current;
		if (!canvas) return;

		const w = canvas.width;
		const h = canvas.height;

		if (format === "svg") {
			const svg = getSvgExport(state.shapes, w, h);
			downloadText(svg, "canvas-export.svg", "image/svg+xml");
			return;
		}

		const cleanCanvas = renderClean(canvas);
		const mimeType = format === "png" ? "image/png" : "image/jpeg";
		cleanCanvas.toBlob(
			(blob) => {
				if (blob) downloadBlob(blob, `canvas-export.${format}`);
			},
			mimeType,
			0.95,
		);
	};

	const handleReset = () => {
		if (window.confirm("Are you sure you want to clear the canvas?")) {
			dispatch({ type: "RESET" });
		}
	};

	return (
		<div className="flex flex-wrap items-center gap-2">
			<button
				type="button"
				className="btn btn-sm"
				disabled={!canUndo}
				onClick={() => dispatch({ type: "UNDO" })}
			>
				Undo
			</button>
			<button
				type="button"
				className="btn btn-sm"
				disabled={!canRedo}
				onClick={() => dispatch({ type: "REDO" })}
			>
				Redo
			</button>
			<button
				type="button"
				className="btn btn-sm btn-error"
				disabled={!state.selectedId}
				onClick={() =>
					state.selectedId &&
					dispatch({ type: "DELETE_SHAPE", id: state.selectedId })
				}
			>
				Delete
			</button>

			<div className="relative" ref={dropdownRef}>
				<button
					type="button"
					className="btn btn-sm"
					onClick={() => setExportOpen(!exportOpen)}
				>
					Export ▾
				</button>
				{exportOpen && (
					<ul className="absolute z-20 mt-1 w-32 rounded-box border border-base-300 bg-base-100 shadow-lg">
						<li>
							<button
								type="button"
								className="w-full px-3 py-1.5 text-left text-sm hover:bg-base-200"
								onClick={() => handleExport("png")}
							>
								PNG
							</button>
						</li>
						<li>
							<button
								type="button"
								className="w-full px-3 py-1.5 text-left text-sm hover:bg-base-200"
								onClick={() => handleExport("jpg")}
							>
								JPG
							</button>
						</li>
						<li>
							<button
								type="button"
								className="w-full px-3 py-1.5 text-left text-sm hover:bg-base-200"
								onClick={() => handleExport("svg")}
							>
								SVG
							</button>
						</li>
					</ul>
				)}
			</div>

			<button
				type="button"
				className="btn btn-sm btn-warning"
				onClick={handleReset}
			>
				Reset
			</button>
		</div>
	);
}
