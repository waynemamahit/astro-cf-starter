## Context

The home page currently shows a static welcome message with multi-framework counter demos. We are replacing it with an interactive HTML Canvas drawing application. The project uses Astro SSR with Cloudflare adapter, supports React/Vue/Solid islands, and uses Tailwind v4 + DaisyUI 5 for styling. No client-side state management library exists yet.

## Goals / Non-Goals

**Goals:**
- Replace `src/pages/index.astro` with interactive canvas page
- Implement point, rectangle, and square creation via mouse interactions
- Implement selection, move, resize, delete, undo/redo
- Implement export to PNG/JPG/SVG
- Implement localStorage persistence and restore
- Implement user guide, stats, and reset controls

**Non-Goals:**
- Server-side persistence (localStorage only)
- Multi-user or collaborative drawing
- Freeform drawing or shape editing beyond resize
- Touch/mobile gestures (mouse-only for v1)

## Decisions

1. **Framework: React** — Canvas requires rich imperative event handling (mousedown, mousemove, mouseup, drag, resize corners). React's useRef + useEffect pattern gives direct canvas access while staying in the Astro island model. Existing React component (`src/components/react/Counter.tsx`) provides a proven pattern.

2. **State management: useReducer + Context** — A single `useReducer` holds the full canvas state (shapes, history for undo/redo, selection). Context provides the dispatch + state to all children. No external store library needed for this scope.

3. **Canvas rendering: HTML Canvas 2D API** — Direct Canvas API for full control over painting order (points always on top, rectangles/squares by creation time z-order), hit detection, and corner handle rendering. No library (Fabric.js, Konva) to keep bundle small.

4. **Export: Canvas.toBlob() + download link** — For PNG/JPG use `canvas.toBlob()`; for SVG use a serialized representation drawn to a separate offscreen canvas then converted. This avoids any external export library.

5. **Component structure:**
   - `Canvas.tsx` — the `<canvas>` element + mouse event handlers + rendering loop
   - `Toolbar.tsx` — undo/redo, delete, export, reset buttons
   - `StatsPanel.tsx` — point/rectangle/square count
   - `UserGuide.tsx` — keyboard shortcuts and usage help
   - `CanvasStore.tsx` — context provider wrapping the useReducer

   All placed under `src/components/react/`.

6. **Z-order**: Points rendered last (on top). Rectangles/squares sorted by creation timestamp (earliest first = bottom). Selection highlight drawn on a separate pass.

7. **Resize**: Each rectangle/square stores its four corner positions. On mousedown on a corner, that corner's index is captured and the opposite corner stays fixed during drag.

8. **Undo/Redo**: History stack of shape snapshots (deep clone of shapes array). Undo pops current state to previous; redo pushes forward. Capped at 50 entries.

9. **Persistence**: `localStorage.setItem('canvas-state', JSON.stringify(state))` on each mutation. Restore on mount if key exists.

## Risks / Trade-offs

- Canvas 2D hit detection requires manual point-in-rectangle and point-near-point math — more code than a library but more performant
- localStorage has 5MB limit — sufficient for canvas state but not for large drawings
- No touch support in v1 — mobile users won't be able to draw
- Using React for imperative Canvas code means some patterns (refs, manual rendering loops) that differ from typical React declarative style
