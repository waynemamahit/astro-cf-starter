export interface Point {
	id: string;
	type: "point";
	x: number;
	y: number;
	createdAt: number;
}

export interface Rectangle {
	id: string;
	type: "rectangle";
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	createdAt: number;
}

export interface Square {
	id: string;
	type: "square";
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	createdAt: number;
}

export type Shape = Point | Rectangle | Square;

export interface CanvasState {
	shapes: Shape[];
	selectedId: string | null;
	history: Shape[][];
	historyIndex: number;
}

export type CanvasAction =
	| { type: "ADD_SHAPE"; shape: Shape }
	| { type: "MOVE_SHAPE"; id: string; dx: number; dy: number }
	| {
			type: "RESIZE_SHAPE";
			id: string;
			x1: number;
			y1: number;
			x2: number;
			y2: number;
	  }
	| { type: "DELETE_SHAPE"; id: string }
	| { type: "SELECT_SHAPE"; id: string }
	| { type: "DESELECT" }
	| { type: "UNDO" }
	| { type: "REDO" }
	| { type: "RESET" }
	| { type: "RESTORE"; shapes: Shape[] };

export const STORAGE_KEY = "canvas-state";
export const MAX_HISTORY = 50;
