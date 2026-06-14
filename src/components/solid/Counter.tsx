import { createSignal } from "solid-js";

interface CounterProps {
	start?: number;
}

export default function Counter(props: CounterProps) {
	const [count, setCount] = createSignal(props.start ?? 0);

	return (
		<div class="card border border-base-300 bg-base-100 shadow-md">
			<div class="card-body items-center gap-4 text-center">
				<span class="badge badge-success">Solid</span>
				<p class="text-4xl font-bold tabular-nums">{count()}</p>
				<div class="join">
					<button
						type="button"
						class="btn join-item"
						onClick={() => setCount(count() - 1)}
					>
						-
					</button>
					<button
						type="button"
						class="btn join-item"
						onClick={() => setCount(count() + 1)}
					>
						+
					</button>
				</div>
			</div>
		</div>
	);
}
