## Why

The current home page is static and doesn't demonstrate the interactive capabilities of the platform. Adding an interactive canvas will showcase drawing tools (points, rectangles, squares) with full edit, undo/redo, export, and persistence features — providing a compelling demo and reusable component for future projects.

## What Changes

- Replace home page (`src/pages/index.astro`) with an interactive canvas page
- Implement point creation on click with coordinate hover labels
- Implement rectangle creation via click+drag with dimension/area labels; hold Shift for squares
- Implement resize of rectangles/squares on corner handles with live dimension/area labels
- Implement move of rectangles/squares via drag-and-drop
- Implement selection, delete (button + Delete key), undo/redo (button + shortcuts)
- Implement export to PNG, JPG, SVG
- Implement auto-save to localStorage and restore on page load
- Implement user guide panel, count statistics, and reset functionality

## Capabilities

### New Capabilities
- `interactive-canvas`: Core canvas rendering, shape management, undo/redo, persistence, export, and UI controls

### Modified Capabilities
*(none)*

## Impact

- `src/pages/index.astro` — replaced with canvas page
- New components under `src/components/` for canvas, toolbar, stats, guide
- New composables/stores under `src/lib/` for canvas state management and persistence
- No new external dependencies; uses HTML Canvas API and localStorage
