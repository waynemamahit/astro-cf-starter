/** @jsxImportSource react */

export default function UserGuide() {
	return (
		<div className="text-sm text-base-content/70">
			<h3 className="mb-2 font-semibold">How to Use</h3>
			<ul className="list-inside list-disc space-y-1">
				<li>
					<strong>Click</strong> canvas to create a point
				</li>
				<li>
					<strong>Click + drag</strong> to create a rectangle
				</li>
				<li>
					<strong>Shift + drag</strong> to create a square
				</li>
				<li>
					<strong>Click shape</strong> to select it
				</li>
				<li>
					<strong>Drag selected shape</strong> to move it
				</li>
				<li>
					<strong>Drag corner handle</strong> to resize (<strong>Shift</strong>{" "}
					to constrain proportions)
				</li>
				<li>
					<strong>Delete key</strong> to delete selected
				</li>
				<li>
					<strong>Ctrl+Z</strong> to undo, <strong>Ctrl+Shift+Z</strong> or{" "}
					<strong>Ctrl+Y</strong> to redo
				</li>
			</ul>
		</div>
	);
}
