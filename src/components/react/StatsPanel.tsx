/** @jsxImportSource react */
import { useCanvas } from "./CanvasStore";

export default function StatsPanel() {
	const { state } = useCanvas();

	let points = 0;
	let rectangles = 0;
	let squares = 0;

	for (const s of state.shapes) {
		if (s.type === "point") {
			points++;
		} else {
			const { w, h } = {
				w: Math.abs(s.x2 - s.x1),
				h: Math.abs(s.y2 - s.y1),
			};
			if (Math.round(w) === Math.round(h)) {
				squares++;
			} else {
				rectangles++;
			}
		}
	}

	return (
		<div className="flex gap-4 text-sm">
			<span className="badge badge-outline">Points: {points}</span>
			<span className="badge badge-outline">Rectangles: {rectangles}</span>
			<span className="badge badge-outline">Squares: {squares}</span>
		</div>
	);
}
