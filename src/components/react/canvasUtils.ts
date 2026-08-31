import type { Rectangle, Square } from "./canvasTypes";

export function getRect(r: Rectangle | Square) {
	const x = Math.min(r.x1, r.x2);
	const y = Math.min(r.y1, r.y2);
	const w = Math.abs(r.x2 - r.x1);
	const h = Math.abs(r.y2 - r.y1);
	return { x, y, w, h };
}

export function pointInRect(
	px: number,
	py: number,
	r: Rectangle | Square,
): boolean {
	const { x, y, w, h } = getRect(r);
	return px >= x && px <= x + w && py >= y && py <= y + h;
}
