## ADDED Requirements

### Requirement: Canvas rendering
The system SHALL render an interactive HTML Canvas element on the home page that supports drawing points, rectangles, and squares.

#### Scenario: Canvas is displayed on home page
- **WHEN** user navigates to the home page
- **THEN** an HTML Canvas element is visible and renders at full viewport width with a minimum height of 500px

### Requirement: Point creation
The system SHALL create a point at the click location when the user clicks on the canvas without dragging.

#### Scenario: Create point on click
- **WHEN** user clicks on the canvas at coordinates (x, y)
- **THEN** a small filled circle is drawn at (x, y) with a visible radius of 4px
- **AND** the point is added to the shapes list

#### Scenario: Point displays coordinates on hover
- **WHEN** user hovers over a created point
- **THEN** a label showing "(x, y)" coordinates is displayed near the point

#### Scenario: Point is not auto-selected after creation
- **WHEN** user creates a new point
- **THEN** the point is not automatically selected

### Requirement: Rectangle creation
The system SHALL create a rectangle when the user clicks and drags on the canvas.

#### Scenario: Create rectangle via click-drag
- **WHEN** user presses mouse down at position (x1, y1), drags, and releases at (x2, y2)
- **THEN** a rectangle is created with corners at (x1, y1) and (x2, y2)

#### Scenario: Rectangle displays dimension and area labels
- **WHEN** user creates or hovers over a rectangle
- **THEN** a label showing "W x H (Area: N sq px)" is displayed near the rectangle

### Requirement: Square creation with Shift
The system SHALL create a square when the user clicks and drags while holding the Shift key.

#### Scenario: Create square via click-drag with Shift
- **WHEN** user presses Shift, presses mouse down, drags, and releases
- **THEN** a square is created where width equals height (using the larger of the two dimensions)

### Requirement: Shape selection
The system SHALL allow the user to select points, rectangles, and squares by clicking on them.

#### Scenario: Select existing shape
- **WHEN** user clicks on an existing point or inside an existing rectangle/square
- **THEN** the shape is visually highlighted as selected

#### Scenario: Deselect by clicking empty area
- **WHEN** user clicks on empty canvas area
- **THEN** the current selection is cleared

### Requirement: Shape deletion
The system SHALL allow deletion of selected shapes via button and keyboard.

#### Scenario: Delete selected shape with button
- **WHEN** a shape is selected and user clicks the Delete button
- **THEN** the selected shape is removed from the canvas

#### Scenario: Delete selected shape with Delete key
- **WHEN** a shape is selected and user presses the Delete key
- **THEN** the selected shape is removed from the canvas

### Requirement: Move shapes via drag-and-drop
The system SHALL allow moving rectangles and squares by clicking and dragging them.

#### Scenario: Move rectangle by dragging
- **WHEN** user clicks inside a rectangle/square (not on a corner) and drags
- **THEN** the shape moves with the mouse cursor

### Requirement: Resize shapes on corners
The system SHALL allow resizing rectangles and squares by dragging their corner handles.

#### Scenario: Resize via corner drag
- **WHEN** user clicks on a corner handle of a selected rectangle/square and drags
- **THEN** the shape is resized in all directions, with the opposite corner staying fixed

#### Scenario: Live dimension and area labels during resize
- **WHEN** user is dragging a corner handle to resize
- **THEN** a label showing current width, height, and area updates in real-time

#### Scenario: Rectangle resizes into square
- **WHEN** user resizes a rectangle and width equals height
- **THEN** the shape is automatically counted as a square in statistics

### Requirement: Z-order rendering
The system SHALL render shapes in correct z-order: rectangles/squares ordered by creation time (earliest at bottom), points always on top.

#### Scenario: Points render above rectangles
- **WHEN** a point and a rectangle overlap on the canvas
- **THEN** the point is visually rendered above the rectangle

#### Scenario: Rectangles ordered by creation time
- **WHEN** multiple rectangles overlap
- **THEN** the earlier-created rectangle renders below the later-created rectangle

### Requirement: Undo/Redo
The system SHALL support undo and redo of all canvas actions.

#### Scenario: Undo last action via button
- **WHEN** user clicks the Undo button
- **THEN** the canvas state reverts to the previous state before the last action

#### Scenario: Redo last undone action via button
- **WHEN** user clicks the Redo button after an undo
- **THEN** the canvas state advances to the state before the undo

#### Scenario: Undo via keyboard shortcut
- **WHEN** user presses Ctrl+Z
- **THEN** the last action is undone

#### Scenario: Redo via keyboard shortcut
- **WHEN** user presses Ctrl+Shift+Z or Ctrl+Y
- **THEN** the last undone action is redone

### Requirement: Export canvas
The system SHALL allow exporting the canvas drawing as PNG, JPG, or SVG image.

#### Scenario: Export as PNG
- **WHEN** user clicks Export and selects PNG
- **THEN** the canvas content (without selection highlights or UI overlays) is downloaded as a PNG file

#### Scenario: Export as JPG
- **WHEN** user clicks Export and selects JPG
- **THEN** the canvas content is downloaded as a JPG file

#### Scenario: Export as SVG
- **WHEN** user clicks Export and selects SVG
- **THEN** the canvas content is downloaded as an SVG file

### Requirement: Reset canvas
The system SHALL allow resetting/clearing the entire drawing.

#### Scenario: Reset drawing
- **WHEN** user clicks the Reset button
- **THEN** all shapes are removed from the canvas
- **AND** the cleared state is added to the undo history

### Requirement: LocalStorage persistence
The system SHALL automatically save canvas state to localStorage and restore it on page load.

#### Scenario: Auto-save on changes
- **WHEN** any shape is created, moved, resized, or deleted
- **THEN** the full canvas state is saved to localStorage

#### Scenario: Restore on page load
- **WHEN** user reopens the page after closing it
- **THEN** the canvas state is loaded from localStorage and displayed

### Requirement: Count statistics
The system SHALL display a count of all created points, rectangles, and squares.

#### Scenario: Display shape counts
- **WHEN** the canvas has shapes
- **THEN** a statistics panel shows the number of points, rectangles, and squares

#### Scenario: Square auto-detection
- **WHEN** a rectangle has equal width and height (including after resize)
- **THEN** it is displayed in the statistics as a square instead of a rectangle

### Requirement: User guide
The system SHALL display a user guide showing how to use the interactive canvas.

#### Scenario: User guide is visible
- **WHEN** user views the canvas page
- **THEN** a user guide section explains mouse controls, keyboard shortcuts, and button functions

### Requirement: Mouse cursor visibility
The system SHALL ensure the mouse cursor is clearly visible and high-contrast against the canvas.

#### Scenario: High-contrast cursor
- **WHEN** user moves the mouse over the canvas
- **THEN** the cursor is rendered with high contrast against any background color

### Requirement: Toolbar outside canvas
The system SHALL place all action buttons (delete, export, reset, undo, redo) outside the canvas element.

#### Scenario: Buttons are separate from canvas
- **WHEN** user views the canvas page
- **THEN** buttons are positioned outside the canvas element, either above or beside it
