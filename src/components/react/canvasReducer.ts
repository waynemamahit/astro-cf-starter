import type { CanvasAction, CanvasState, Shape } from "./canvasTypes";
import { MAX_HISTORY } from "./canvasTypes";

function pushHistory(shapes: Shape[], state: CanvasState): Shape[][] {
	const newHistory = state.history.slice(0, state.historyIndex + 1);
	newHistory.push(structuredClone(shapes));
	if (newHistory.length > MAX_HISTORY) newHistory.shift();
	return newHistory;
}

export function canvasReducer(
	state: CanvasState,
	action: CanvasAction,
): CanvasState {
	switch (action.type) {
		case "ADD_SHAPE": {
			const shapes = [...state.shapes, action.shape];
			return {
				...state,
				shapes,
				history: pushHistory(shapes, state),
				historyIndex: Math.min(state.historyIndex + 1, MAX_HISTORY - 1),
			};
		}
		case "MOVE_SHAPE": {
			const shapes = state.shapes.map((s) => {
				if (s.id !== action.id || s.type === "point") return s;
				return {
					...s,
					x1: s.x1 + action.dx,
					y1: s.y1 + action.dy,
					x2: s.x2 + action.dx,
					y2: s.y2 + action.dy,
				};
			});
			return {
				...state,
				shapes,
				history: pushHistory(shapes, state),
				historyIndex: Math.min(state.historyIndex + 1, MAX_HISTORY - 1),
			};
		}
		case "RESIZE_SHAPE": {
			const shapes = state.shapes.map((s) => {
				if (s.id !== action.id || s.type === "point") return s;
				return {
					...s,
					x1: action.x1,
					y1: action.y1,
					x2: action.x2,
					y2: action.y2,
				};
			});
			return {
				...state,
				shapes,
				history: pushHistory(shapes, state),
				historyIndex: Math.min(state.historyIndex + 1, MAX_HISTORY - 1),
			};
		}
		case "DELETE_SHAPE": {
			const shapes = state.shapes.filter((s) => s.id !== action.id);
			return {
				...state,
				shapes,
				selectedId: state.selectedId === action.id ? null : state.selectedId,
				history: pushHistory(shapes, state),
				historyIndex: Math.min(state.historyIndex + 1, MAX_HISTORY - 1),
			};
		}
		case "SELECT_SHAPE":
			return { ...state, selectedId: action.id };
		case "DESELECT":
			return { ...state, selectedId: null };
		case "UNDO": {
			if (state.historyIndex <= 0) return state;
			const newIndex = state.historyIndex - 1;
			return {
				...state,
				shapes: structuredClone(state.history[newIndex]),
				historyIndex: newIndex,
				selectedId: null,
			};
		}
		case "REDO": {
			if (state.historyIndex >= state.history.length - 1) return state;
			const newIndex = state.historyIndex + 1;
			return {
				...state,
				shapes: structuredClone(state.history[newIndex]),
				historyIndex: newIndex,
				selectedId: null,
			};
		}
		case "RESET": {
			const shapes: Shape[] = [];
			return {
				...state,
				shapes,
				selectedId: null,
				history: pushHistory(shapes, state),
				historyIndex: Math.min(state.historyIndex + 1, MAX_HISTORY - 1),
			};
		}
		case "RESTORE":
			return {
				...state,
				shapes: action.shapes,
				selectedId: null,
				history: [structuredClone(action.shapes)],
				historyIndex: 0,
			};
		default:
			return state;
	}
}

export const initialState: CanvasState = {
	shapes: [],
	selectedId: null,
	history: [[]],
	historyIndex: 0,
};
