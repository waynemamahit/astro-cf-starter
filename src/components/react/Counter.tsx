/** @jsxImportSource react */
import { useState } from "react";

interface CounterProps {
	start?: number;
}

export default function Counter({ start = 0 }: CounterProps) {
	const [count, setCount] = useState(start);

	return (
		<div className="card border border-base-300 bg-base-100 shadow-md">
			<div className="card-body items-center gap-4 text-center">
				<span className="badge badge-info">React</span>
				<p className="text-4xl font-bold tabular-nums">{count}</p>
				<div className="join">
					<button
						type="button"
						className="btn join-item"
						onClick={() => setCount((c) => c - 1)}
					>
						-
					</button>
					<button
						type="button"
						className="btn join-item"
						onClick={() => setCount((c) => c + 1)}
					>
						+
					</button>
				</div>
			</div>
		</div>
	);
}
