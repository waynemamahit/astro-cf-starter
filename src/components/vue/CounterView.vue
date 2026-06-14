<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(defineProps<{ start?: number }>(), { start: 0 });
const count = ref(props.start);
</script>

<template>
	<div class="card border border-base-300 bg-base-100 shadow-md">
		<div class="card-body items-center gap-4 text-center">
			<span class="badge badge-warning">Vue</span>
			<p class="text-4xl font-bold tabular-nums">{{ count }}</p>
			<div class="join">
				<button type="button" class="btn join-item" @click="count--">-</button>
				<button type="button" class="btn join-item" @click="count++">+</button>
			</div>
		</div>
	</div>
</template>
