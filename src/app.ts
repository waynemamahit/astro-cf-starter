import { handle } from "@astrojs/cloudflare/handler";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { rateLimiter } from "hono-rate-limiter";
import apiV1 from "./server/routes/v1";

const app = new Hono<{ Bindings: Env }>();

// Hono middleware
app.use(logger());
app.use(secureHeaders());
app.use(csrf());
app.use(
	rateLimiter<{ Bindings: Env }>({
		binding: (c) => c.env.LONG_RATE_LIMITER,
		keyGenerator: (c) => c.req.header("cf-connecting-ip") ?? "",
	}),
);
app.use("/api/*", cors());

// Custom API routes handled by Hono
app.route("/api/v1", apiV1);

// Everything else is delegated to Astro's request pipeline.
// `handle()` runs App.render() internally, which attaches the Astro app
// to the request and performs all Cloudflare-specific setup.
app.all("*", (c) =>
	handle(c.req.raw, c.env, c.executionCtx as unknown as ExecutionContext),
);

export default app;

export { Counter } from "./server/durable_objects/counter.do";
