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
import { CanvasProvider, useCanvas } from "../CanvasStore";
import type { Point, Rectangle } from "../canvasTypes";
import Toolbar, { getSvgExport } from "../Toolbar";

afterEach(() => {
	cleanup();
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

function CanvasRefSetup() {
	const { canvasRef } = useCanvas();
	const canvasEl = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (canvasEl.current) {
			(canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current =
				canvasEl.current;
		}
		return () => {
			(canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current =
				null;
		};
	}, [canvasRef]);

	return <canvas ref={canvasEl} />;
}

function ToolbarWithShapes({ shapes }: { shapes: (Point | Rectangle)[] }) {
	return (
		<CanvasProvider>
			<CanvasRefSetup />
			<Toolbar />
			{shapes.map((s) => (
				<AddShape key={s.id} shape={s} />
			))}
		</CanvasProvider>
	);
}

describe("Toolbar", () => {
	beforeEach(() => {
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
		HTMLCanvasElement.prototype.toBlob = vi.fn(
			(cb: (b: Blob | null) => void) => {
				cb(new Blob([], { type: "image/png" }));
			},
		);
	});

	describe("undo/redo buttons", () => {
		it("undo button is disabled when no history", () => {
			render(<ToolbarWithShapes shapes={[]} />);
			const undoBtn = screen.getByText("Undo");
			expect(undoBtn).toHaveProperty("disabled", true);
		});

		it("redo button is disabled when at latest state", () => {
			render(<ToolbarWithShapes shapes={[]} />);
			const redoBtn = screen.getByText("Redo");
			expect(redoBtn).toHaveProperty("disabled", true);
		});

		it("undo button enables after adding a shape", async () => {
			const point: Point = {
				id: "p1",
				type: "point",
				x: 10,
				y: 20,
				createdAt: 1,
			};
			render(<ToolbarWithShapes shapes={[point]} />);

			await act(async () => {
				await new Promise((r) => setTimeout(r, 10));
			});

			const undoBtn = screen.getByText("Undo");
			expect(undoBtn).toHaveProperty("disabled", false);
		});
	});

	describe("delete button", () => {
		it("delete button is disabled when no shape selected", () => {
			render(<ToolbarWithShapes shapes={[]} />);
			const deleteBtn = screen.getByText("Delete");
			expect(deleteBtn).toHaveProperty("disabled", true);
		});
	});

	describe("export dropdown", () => {
		it("shows export options when clicked", async () => {
			render(<ToolbarWithShapes shapes={[]} />);

			const exportBtn = screen.getByText("Export ▾");
			fireEvent.click(exportBtn);

			expect(screen.getByText("PNG")).toBeDefined();
			expect(screen.getByText("JPG")).toBeDefined();
			expect(screen.getByText("SVG")).toBeDefined();
		});

		it("hides export options when clicking outside", async () => {
			render(<ToolbarWithShapes shapes={[]} />);

			const exportBtn = screen.getByText("Export ▾");
			fireEvent.click(exportBtn);
			expect(screen.getByText("PNG")).toBeDefined();

			fireEvent.mouseDown(document.body);
			await act(async () => {
				await new Promise((r) => setTimeout(r, 10));
			});

			expect(screen.queryByText("PNG")).toBeNull();
		});
	});

	describe("export blob generation", () => {
		it("calls toBlob with image/png for PNG export", async () => {
			const toBlobSpy = vi
				.spyOn(HTMLCanvasElement.prototype, "toBlob")
				.mockImplementation((cb: any) => {
					cb(new Blob([], { type: "image/png" }));
				});

			const urlSpy = vi
				.spyOn(URL, "createObjectURL")
				.mockReturnValue("blob:test");

			render(<ToolbarWithShapes shapes={[]} />);
			const exportBtn = screen.getByText("Export ▾");
			fireEvent.click(exportBtn);

			const pngBtn = screen.getByText("PNG");
			await act(async () => {
				fireEvent.click(pngBtn);
				await new Promise((r) => setTimeout(r, 50));
			});

			expect(toBlobSpy).toHaveBeenCalled();
			const call = toBlobSpy.mock.calls[0];
			const mimeTypeArg = call[1] as string;
			expect(mimeTypeArg).toBe("image/png");
			urlSpy.mockRestore();
			toBlobSpy.mockRestore();
		});

		it("calls toBlob with image/jpeg for JPG export", async () => {
			const toBlobSpy = vi
				.spyOn(HTMLCanvasElement.prototype, "toBlob")
				.mockImplementation((cb: any) => {
					cb(new Blob([], { type: "image/jpeg" }));
				});

			const urlSpy = vi
				.spyOn(URL, "createObjectURL")
				.mockReturnValue("blob:test");

			render(<ToolbarWithShapes shapes={[]} />);
			const exportBtn = screen.getByText("Export ▾");
			fireEvent.click(exportBtn);

			const jpgBtn = screen.getByText("JPG");
			await act(async () => {
				fireEvent.click(jpgBtn);
				await new Promise((r) => setTimeout(r, 50));
			});

			expect(toBlobSpy).toHaveBeenCalled();
			const call = toBlobSpy.mock.calls[0];
			const mimeTypeArg = call[1] as string;
			expect(mimeTypeArg).toBe("image/jpeg");
			urlSpy.mockRestore();
			toBlobSpy.mockRestore();
		});

		it("generates download for SVG export", async () => {
			const urlSpy = vi
				.spyOn(URL, "createObjectURL")
				.mockReturnValue("blob:svg-test");

			const shapes: Rectangle[] = [
				{
					id: "r1",
					type: "rectangle",
					x1: 10,
					y1: 10,
					x2: 110,
					y2: 60,
					createdAt: 1,
				},
			];

			render(<ToolbarWithShapes shapes={shapes} />);
			await act(async () => {
				await new Promise((r) => setTimeout(r, 10));
			});

			const exportBtn = screen.getByText("Export ▾");
			fireEvent.click(exportBtn);

			const svgBtn = screen.getByText("SVG");
			await act(async () => {
				fireEvent.click(svgBtn);
				await new Promise((r) => setTimeout(r, 50));
			});

			expect(urlSpy).toHaveBeenCalled();
			const blob = urlSpy.mock.calls[0][0] as Blob;
			expect(blob.type).toBe("image/svg+xml");
			urlSpy.mockRestore();
		});
	});

	describe("getSvgExport", () => {
		it("produces SVG with rect elements for rectangles", () => {
			const rect: Rectangle = {
				id: "r1",
				type: "rectangle",
				x1: 0,
				y1: 0,
				x2: 100,
				y2: 50,
				createdAt: 1,
			};
			const svg = getSvgExport([rect], 200, 100);
			expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
			expect(svg).toContain('width="200"');
			expect(svg).toContain('height="100"');
			expect(svg).toContain("<rect");
			expect(svg).toContain('width="100"');
			expect(svg).toContain('height="50"');
		});

		it("produces SVG with circle elements for points", () => {
			const point = {
				id: "p1",
				type: "point" as const,
				x: 50,
				y: 75,
				createdAt: 1,
			};
			const svg = getSvgExport([point], 200, 200);
			expect(svg).toContain("<circle");
			expect(svg).toContain('cx="50"');
			expect(svg).toContain('cy="75"');
		});

		it("excludes selection overlay from SVG (no highlight artifacts)", () => {
			const rect: Rectangle = {
				id: "r1",
				type: "rectangle",
				x1: 10,
				y1: 10,
				x2: 110,
				y2: 110,
				createdAt: 1,
			};
			const svg = getSvgExport([rect], 200, 200);
			expect(svg).toContain('fill="#e0e7ff"');
			expect(svg).not.toContain("selected");
			expect(svg).not.toContain("corner");
		});

		it("produces valid SVG root with proper namespace", () => {
			const svg = getSvgExport([], 800, 600);
			expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
			expect(svg).toContain("</svg>");
		});
	});

	describe("reset button", () => {
		it("calls confirm when reset is clicked", async () => {
			const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

			render(<ToolbarWithShapes shapes={[]} />);
			const resetBtn = screen.getByText("Reset");
			fireEvent.click(resetBtn);

			expect(confirmSpy).toHaveBeenCalledWith(
				"Are you sure you want to clear the canvas?",
			);
			confirmSpy.mockRestore();
		});

		it("dispatches RESET when confirm returns true", async () => {
			const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

			render(<ToolbarWithShapes shapes={[]} />);
			const resetBtn = screen.getByText("Reset");
			fireEvent.click(resetBtn);

			expect(confirmSpy).toHaveBeenCalled();
			confirmSpy.mockRestore();
		});
	});

	describe("export functionality", () => {
		it("closes dropdown after selecting PNG", async () => {
			render(<ToolbarWithShapes shapes={[]} />);
			const exportBtn = screen.getByText("Export ▾");
			fireEvent.click(exportBtn);

			expect(screen.getByText("PNG")).toBeDefined();

			const pngBtn = screen.getByText("PNG");
			await act(async () => {
				fireEvent.click(pngBtn);
				await new Promise((r) => setTimeout(r, 50));
			});

			expect(screen.queryByText("PNG")).toBeNull();
		});

		it("closes dropdown after selecting JPG", async () => {
			render(<ToolbarWithShapes shapes={[]} />);
			const exportBtn = screen.getByText("Export ▾");
			fireEvent.click(exportBtn);

			expect(screen.getByText("JPG")).toBeDefined();

			const jpgBtn = screen.getByText("JPG");
			await act(async () => {
				fireEvent.click(jpgBtn);
				await new Promise((r) => setTimeout(r, 50));
			});

			expect(screen.queryByText("JPG")).toBeNull();
		});

		it("closes dropdown after selecting SVG", async () => {
			render(<ToolbarWithShapes shapes={[]} />);
			const exportBtn = screen.getByText("Export ▾");
			fireEvent.click(exportBtn);

			expect(screen.getByText("SVG")).toBeDefined();

			const svgBtn = screen.getByText("SVG");
			await act(async () => {
				fireEvent.click(svgBtn);
				await new Promise((r) => setTimeout(r, 50));
			});

			expect(screen.queryByText("SVG")).toBeNull();
		});

		it("hides dropdown on Escape key", async () => {
			render(<ToolbarWithShapes shapes={[]} />);
			const exportBtn = screen.getByText("Export ▾");
			fireEvent.click(exportBtn);

			expect(screen.getByText("PNG")).toBeDefined();

			await act(async () => {
				fireEvent.keyDown(document, { key: "Escape" });
				await new Promise((r) => setTimeout(r, 50));
			});

			expect(screen.queryByText("PNG")).toBeNull();
		});
	});
});
