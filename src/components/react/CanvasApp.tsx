/** @jsxImportSource react */

import Canvas from "./Canvas";
import { CanvasProvider } from "./CanvasStore";
import StatsPanel from "./StatsPanel";
import Toolbar from "./Toolbar";

export default function CanvasApp() {
	return (
		<CanvasProvider>
			<div className="mb-4 flex flex-wrap items-center justify-between gap-4">
				<Toolbar />
				<StatsPanel />
			</div>
			<Canvas />
		</CanvasProvider>
	);
}
