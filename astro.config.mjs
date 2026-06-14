// @ts-check
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import solidJs from "@astrojs/solid-js";
import vue from "@astrojs/vue";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	output: "server",

	adapter: cloudflare({
		remoteBindings: false,
	}),

	integrations: [
		mdx(),
		react({
			include: ["**/react/*"],
		}),
		solidJs({
			include: ["**/solid/*"],
		}),
		vue({
			include: ["**/vue/*"],
		}),
	],

	vite: {
		plugins: [tailwindcss()],
	},
});
