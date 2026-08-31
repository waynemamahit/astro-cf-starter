## 1. State Management & Types

- [x] 1.1 Define TypeScript types for shapes (Point, Rectangle, Square, Shape union) and canvas state (shapes, selectedId, history, historyIndex) in `src/components/react/canvasTypes.ts`
- [x] 1.2 Implement `useReducer` with actions: ADD_SHAPE, MOVE_SHAPE, RESIZE_SHAPE, DELETE_SHAPE, SELECT_SHAPE, DESELECT, UNDO, REDO, RESET, RESTORE in `src/components/react/canvasReducer.ts`
- [x] 1.3 Implement `CanvasProvider` context component wrapping the reducer with localStorage auto-save on change and restore on mount in `src/components/react/CanvasStore.tsx`

## 2. Canvas Rendering & Mouse Interaction

- [x] 2.1 Implement `Canvas` React component with `<canvas>` element, responsive sizing (full viewport width, min 500px height), and high-contrast cursor in `src/components/react/Canvas.tsx`
- [x] 2.2 Implement point hit detection (distance-based) and rectangle/square hit detection (point-in-rect) for selection in `src/components/react/Canvas.tsx`
- [x] 2.3 Implement rendering loop: draw rectangles/squares sorted by creation time (z-order), then draw points on top, selection highlight, and corner handles in `src/components/react/Canvas.tsx`
- [x] 2.4 Implement mouse event handlers: click to create point, click+drag to create rectangle (Shift for square), click to select, click empty to deselect in `src/components/react/Canvas.tsx`
- [x] 2.5 Implement drag-and-drop to move rectangles/squares (detect click inside shape but not on corner) in `src/components/react/Canvas.tsx`
- [x] 2.6 Implement corner resize: detect corner click, fix opposite corner, track drag for live resize with dimension/area labels in `src/components/react/Canvas.tsx`
- [x] 2.7 Implement hover labels: coordinate tooltip for points, WxH+area tooltip for rectangles/squares in `src/components/react/Canvas.tsx`

## 3. Toolbar & Controls

- [x] 3.1 Implement `Toolbar` React component with undo, redo, delete, export (PNG/JPG/SVG dropdown), and reset buttons in `src/components/react/Toolbar.tsx`
- [x] 3.2 Wire keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z / Ctrl+Y (redo), Delete key (delete selected) via `useEffect` global listener in `src/components/react/Canvas.tsx`
- [x] 3.3 Implement export functions: canvas.toBlob for PNG/JPG, custom SVG serialization for SVG export in `src/components/react/Toolbar.tsx`
- [x] 3.4 Implement reset with confirmation and cleared state added to undo history in `src/components/react/Toolbar.tsx`

## 4. Stats & User Guide

- [x] 4.1 Implement `StatsPanel` React component showing counts of points, rectangles, and squares (auto-detect squares by width===height) in `src/components/react/StatsPanel.tsx`
- [x] 4.2 Implement `UserGuide` React component listing mouse controls, keyboard shortcuts, and button functions in `src/components/react/UserGuide.tsx`

## 5. Page Integration

- [x] 5.1 Update `src/pages/index.astro` to import and render `CanvasStore` provider wrapping `Canvas`, `Toolbar`, `StatsPanel`, and `UserGuide` components with `client:load` directives
- [x] 5.2 Remove old Welcome.astro and multi-framework counter imports from index.astro (or keep as secondary content below canvas)

## 6. Verification Fixes

- [x] 6.1 Extract duplicate `getRect` helper from `CanvasStore.tsx` and `Canvas.tsx` into shared utility in `src/components/react/canvasUtils.ts`
- [x] 6.2 Add hover tooltip test to `Canvas.test.tsx` verifying coordinate labels for points and dimension labels for rectangles
- [x] 6.3 Add resize interaction test to `Canvas.test.tsx` verifying corner drag dispatches RESIZE_SHAPE and shows live labels
- [x] 6.4 Add z-order rendering test to `Canvas.test.tsx` verifying points draw after rectangles and rectangles are sorted by creation time
- [x] 6.5 Add export blob generation test to `Toolbar.test.tsx` verifying PNG, JPG, and SVG export produce valid output
- [x] 6.6 Add square-auto-detection-after-resize test to `StatsPanel.test.tsx` verifying a rectangle with equal dimensions counts as square
- [x] 6.7 Update stale page title assertion in `e2e/index.spec.ts` to match current canvas page (verified: title is still "Astro Basics" in Layout.astro)
