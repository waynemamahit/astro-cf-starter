/** @jsxImportSource react */
import { describe, expect, it } from "vitest";
import { canvasReducer, initialState } from "../canvasReducer";
import type { Point, Rectangle, Shape, Square } from "../canvasTypes";
import { MAX_HISTORY } from "../canvasTypes";

function makePoint(id: string, x = 0, y = 0): Point {
	return { id, type: "point", x, y, createdAt: Date.now() };
}

function makeRect(id: string, x1 = 0, y1 = 0, x2 = 100, y2 = 100): Rectangle {
	return { id, type: "rectangle", x1, y1, x2, y2, createdAt: Date.now() };
}

function makeSquare(id: string, x1 = 0, y1 = 0, size = 100): Square {
	return {
		id,
		type: "square",
		x1,
		y1,
		x2: x1 + size,
		y2: y1 + size,
		createdAt: Date.now(),
	};
}

describe("canvasReducer", () => {
	it("ADD_SHAPE adds a shape and pushes history", () => {
		const p = makePoint("p1");
		const state = canvasReducer(initialState, { type: "ADD_SHAPE", shape: p });
		expect(state.shapes).toEqual([p]);
		expect(state.history.length).toBe(2);
		expect(state.historyIndex).toBe(1);
	});

	it("DELETE_SHAPE removes shape and clears selection if deleted", () => {
		const p = makePoint("p1");
		const withPoint = canvasReducer(initialState, {
			type: "ADD_SHAPE",
			shape: p,
		});
		const selected = canvasReducer(withPoint, {
			type: "SELECT_SHAPE",
			id: "p1",
		});
		const deleted = canvasReducer(selected, { type: "DELETE_SHAPE", id: "p1" });
		expect(deleted.shapes).toEqual([]);
		expect(deleted.selectedId).toBeNull();
	});

	it("DELETE_SHAPE leaves selection if other shape deleted", () => {
		const p1 = makePoint("p1");
		const p2 = makePoint("p2");
		const s1 = canvasReducer(initialState, { type: "ADD_SHAPE", shape: p1 });
		const s2 = canvasReducer(s1, { type: "ADD_SHAPE", shape: p2 });
		const sel = canvasReducer(s2, { type: "SELECT_SHAPE", id: "p1" });
		const del = canvasReducer(sel, { type: "DELETE_SHAPE", id: "p2" });
		expect(del.selectedId).toBe("p1");
	});

	it("MOVE_SHAPE ignores points (no-op for point type)", () => {
		const p = makePoint("p1", 10, 20);
		const added = canvasReducer(initialState, { type: "ADD_SHAPE", shape: p });
		const moved = canvasReducer(added, {
			type: "MOVE_SHAPE",
			id: "p1",
			dx: 5,
			dy: -3,
		});
		const movedShape = moved.shapes[0] as Point;
		expect(movedShape.x).toBe(10);
		expect(movedShape.y).toBe(20);
	});

	it("MOVE_SHAPE updates square coordinates", () => {
		const s = makeSquare("s1", 0, 0, 100);
		const added = canvasReducer(initialState, { type: "ADD_SHAPE", shape: s });
		const moved = canvasReducer(added, {
			type: "MOVE_SHAPE",
			id: "s1",
			dx: 10,
			dy: 20,
		});
		const movedShape = moved.shapes[0] as Square;
		expect(movedShape.x1).toBe(10);
		expect(movedShape.y1).toBe(20);
		expect(movedShape.x2).toBe(110);
		expect(movedShape.y2).toBe(120);
		expect(movedShape.type).toBe("square");
	});

	it("MOVE_SHAPE updates rectangle coordinates", () => {
		const r = makeRect("r1", 0, 0, 100, 100);
		const added = canvasReducer(initialState, { type: "ADD_SHAPE", shape: r });
		const moved = canvasReducer(added, {
			type: "MOVE_SHAPE",
			id: "r1",
			dx: 10,
			dy: 20,
		});
		const movedShape = moved.shapes[0] as Rectangle;
		expect(movedShape.x1).toBe(10);
		expect(movedShape.y1).toBe(20);
		expect(movedShape.x2).toBe(110);
		expect(movedShape.y2).toBe(120);
	});

	it("RESIZE_SHAPE updates rectangle corners", () => {
		const r = makeRect("r1", 0, 0, 100, 100);
		const added = canvasReducer(initialState, { type: "ADD_SHAPE", shape: r });
		const resized = canvasReducer(added, {
			type: "RESIZE_SHAPE",
			id: "r1",
			x1: 10,
			y1: 10,
			x2: 200,
			y2: 200,
		});
		const resizedShape = resized.shapes[0] as Rectangle;
		expect(resizedShape.x1).toBe(10);
		expect(resizedShape.y1).toBe(10);
		expect(resizedShape.x2).toBe(200);
		expect(resizedShape.y2).toBe(200);
	});

	it("SELECT_SHAPE and DESELECT work", () => {
		const p = makePoint("p1");
		const added = canvasReducer(initialState, { type: "ADD_SHAPE", shape: p });
		const selected = canvasReducer(added, { type: "SELECT_SHAPE", id: "p1" });
		expect(selected.selectedId).toBe("p1");
		const deselected = canvasReducer(selected, { type: "DESELECT" });
		expect(deselected.selectedId).toBeNull();
	});

	it("UNDO reverts to previous state", () => {
		const p = makePoint("p1");
		const added = canvasReducer(initialState, { type: "ADD_SHAPE", shape: p });
		expect(added.shapes.length).toBe(1);
		const undone = canvasReducer(added, { type: "UNDO" });
		expect(undone.shapes.length).toBe(0);
		expect(undone.historyIndex).toBe(0);
	});

	it("UNDO at start does nothing", () => {
		const state = canvasReducer(initialState, { type: "UNDO" });
		expect(state.historyIndex).toBe(0);
	});

	it("REDO advances after undo", () => {
		const p = makePoint("p1");
		const added = canvasReducer(initialState, { type: "ADD_SHAPE", shape: p });
		const undone = canvasReducer(added, { type: "UNDO" });
		const redone = canvasReducer(undone, { type: "REDO" });
		expect(redone.shapes.length).toBe(1);
		expect(redone.historyIndex).toBe(1);
	});

	it("REDO at latest does nothing", () => {
		const p = makePoint("p1");
		const added = canvasReducer(initialState, { type: "ADD_SHAPE", shape: p });
		const state = canvasReducer(added, { type: "REDO" });
		expect(state.historyIndex).toBe(1);
	});

	it("RESET clears shapes and pushes history", () => {
		const p = makePoint("p1");
		const added = canvasReducer(initialState, { type: "ADD_SHAPE", shape: p });
		const reset = canvasReducer(added, { type: "RESET" });
		expect(reset.shapes).toEqual([]);
		expect(reset.selectedId).toBeNull();
		expect(reset.historyIndex).toBe(2);
	});

	it("RESTORE replaces shapes and resets history", () => {
		const shapes: Shape[] = [makePoint("p1"), makeRect("r1")];
		const restored = canvasReducer(initialState, { type: "RESTORE", shapes });
		expect(restored.shapes).toEqual(shapes);
		expect(restored.selectedId).toBeNull();
		expect(restored.historyIndex).toBe(0);
		expect(restored.history.length).toBe(1);
	});

	it("history is capped at MAX_HISTORY", () => {
		let state = initialState;
		for (let i = 0; i < MAX_HISTORY + 10; i++) {
			state = canvasReducer(state, {
				type: "ADD_SHAPE",
				shape: makePoint(`p${i}`, i, i),
			});
		}
		expect(state.history.length).toBeLessThanOrEqual(MAX_HISTORY);
	});

	it("history truncates after undo then new action", () => {
		let state = canvasReducer(initialState, {
			type: "ADD_SHAPE",
			shape: makePoint("p1"),
		});
		state = canvasReducer(state, { type: "ADD_SHAPE", shape: makePoint("p2") });
		state = canvasReducer(state, { type: "ADD_SHAPE", shape: makePoint("p3") });
		expect(state.history.length).toBe(4);
		expect(state.historyIndex).toBe(3);

		state = canvasReducer(state, { type: "UNDO" });
		state = canvasReducer(state, { type: "UNDO" });
		expect(state.historyIndex).toBe(1);
		expect(state.shapes).toHaveLength(1);

		state = canvasReducer(state, { type: "ADD_SHAPE", shape: makePoint("p4") });
		expect(state.history.length).toBe(3);
		expect(state.historyIndex).toBe(2);
		expect(state.shapes).toHaveLength(2);
		expect((state.shapes[1] as Point).id).toBe("p4");
	});

	it("multiple sequential undo/redo operations", () => {
		let state = canvasReducer(initialState, {
			type: "ADD_SHAPE",
			shape: makePoint("p1"),
		});
		state = canvasReducer(state, { type: "ADD_SHAPE", shape: makePoint("p2") });
		state = canvasReducer(state, { type: "ADD_SHAPE", shape: makePoint("p3") });
		state = canvasReducer(state, { type: "ADD_SHAPE", shape: makePoint("p4") });
		state = canvasReducer(state, { type: "ADD_SHAPE", shape: makePoint("p5") });

		expect(state.shapes).toHaveLength(5);

		state = canvasReducer(state, { type: "UNDO" });
		state = canvasReducer(state, { type: "UNDO" });
		state = canvasReducer(state, { type: "UNDO" });
		expect(state.shapes).toHaveLength(2);
		expect(state.historyIndex).toBe(2);

		state = canvasReducer(state, { type: "REDO" });
		state = canvasReducer(state, { type: "REDO" });
		expect(state.shapes).toHaveLength(4);
		expect(state.historyIndex).toBe(4);

		state = canvasReducer(state, { type: "UNDO" });
		state = canvasReducer(state, { type: "UNDO" });
		state = canvasReducer(state, { type: "UNDO" });
		state = canvasReducer(state, { type: "UNDO" });
		state = canvasReducer(state, { type: "UNDO" });
		expect(state.shapes).toHaveLength(0);
		expect(state.historyIndex).toBe(0);

		state = canvasReducer(state, { type: "UNDO" });
		expect(state.historyIndex).toBe(0);
		expect(state.shapes).toHaveLength(0);
	});

	it("RESIZE_SHAPE updates square corners", () => {
		const s = makeSquare("s1", 0, 0, 100);
		const added = canvasReducer(initialState, { type: "ADD_SHAPE", shape: s });
		const resized = canvasReducer(added, {
			type: "RESIZE_SHAPE",
			id: "s1",
			x1: 10,
			y1: 10,
			x2: 200,
			y2: 200,
		});
		const resizedShape = resized.shapes[0] as Square;
		expect(resizedShape.x1).toBe(10);
		expect(resizedShape.y1).toBe(10);
		expect(resizedShape.x2).toBe(200);
		expect(resizedShape.y2).toBe(200);
		expect(resizedShape.type).toBe("square");
	});

	it("MOVE_SHAPE after undo preserves history integrity", () => {
		let state = canvasReducer(initialState, {
			type: "ADD_SHAPE",
			shape: makeRect("r1", 0, 0, 100, 100),
		});
		state = canvasReducer(state, {
			type: "MOVE_SHAPE",
			id: "r1",
			dx: 50,
			dy: 50,
		});
		expect(state.shapes[0]).toMatchObject({ x1: 50, y1: 50, x2: 150, y2: 150 });

		state = canvasReducer(state, { type: "UNDO" });
		expect(state.shapes[0]).toMatchObject({ x1: 0, y1: 0, x2: 100, y2: 100 });

		state = canvasReducer(state, { type: "REDO" });
		expect(state.shapes[0]).toMatchObject({ x1: 50, y1: 50, x2: 150, y2: 150 });
	});
});
