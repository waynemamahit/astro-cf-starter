# Astro Cloudflare Starter

A production-ready full-stack starter template built on **Astro (Islands Architecture)** with **Cloudflare Workers**. Interactive islands render in **React, Vue, and SolidJS** on top of Astro's server-first model, while a **Hono** API is mounted inside the same Worker (`src/app.ts`) and delegates SSR to Astro via `@astrojs/cloudflare`. Includes comprehensive Cloudflare service integrations, clean architecture following SOLID principles, and specification-driven development with OpenSpec.

> **📖 Full Project Specification:** See [`openspec/config.yaml`](./openspec/config.yaml) for complete technical requirements, architecture patterns, and coding conventions.

## Key Features

### Frontend
- **Astro 6.4+** — Server-first Islands Architecture that ships minimal client JS
- **Multi-framework islands** — React 19, Vue 3, and SolidJS components hydrated via `client:*` directives (scoped by folder: `**/react/*`, `**/vue/*`, `**/solid/*`); pick the framework **performance-first**, fall back to the best-compatibility framework when a required library demands it
- **MDX** — `@astrojs/mdx` for content pages/components (`.mdx`) with island support
- **TypeScript 6.0+** — Strict type safety (`astro/tsconfigs/strict`), **no `any` type allowed**
- **TailwindCSS 4.3+** — Utility-first CSS with mobile-first responsive design (`@tailwindcss/vite`)
- **Semantic HTML & ARIA** — Accessibility (skip links, keyboard nav, focus management) and SEO
- **DaisyUI 5.5+** — UI components with customizable themes (default: **light**)
- **Lucide icons** — `lucide-react`, `@lucide/vue`, and `lucide-solid`
- **i18n-ready** — Astro built-in i18n routing + i18next (not yet wired in)
- **Form Layouts** — Following [TailwindCSS form layouts](https://tailwindcss.com/plus/ui-blocks/application-ui/forms/form-layouts)

### Backend
- **Hono 4.12+** — Fast, edge-native API framework mounted in `src/app.ts` (delegates SSR to Astro)
- **TypeScript 6.0+** — Type-safe backend, **no `any` type allowed**
- **i18n-ready** — i18next with Hono for API messages (not yet wired in)
- **CSRF Protection** — Hono `csrf()` middleware for all mutation endpoints
- **CORS Protection** — Configurable origins via `CORS_ALLOWED_ORIGINS` in `wrangler.jsonc`
- **Rate Limiting** — Edge-native via Cloudflare `RateLimit` bindings with `hono-rate-limiter`
- **Secure Headers** — CSP, X-Frame-Options, etc. via `hono/secure-headers`
- **Logger Service** — Centralized logging with correlation ID and sensitive data sanitization
- **Global Error Handling** — Automatic error catching and logging for production debugging
- **Zod 4+** — Request validation via `@hono/zod-validator` middleware

### Architecture
- **Clean Architecture** — Engine/Facade and Service layers with SOLID principles
- **Dependency Injection** — Awilix 13+ with interface-based contracts (following [Awilix guide](https://github.com/jeffijoe/awilix/blob/master/README.md))
- **Layer Discipline** — Only create engine layer when orchestrating 2+ services
- **Drizzle ORM 0.45+** — Type-safe database with separate D1/Hyperdrive schemas/migrations
- **Zod 4+** — Shared runtime schema validation (frontend + backend)
- **i18n-ready** — Astro i18n routing + i18next, centralized (not yet wired in)
- **Theme & Language Selector** — Built into the main layout with DaisyUI themes

### Testing
- **Vitest 4.1+** — Unit + integration testing (`vitest/config`, jsdom, React JSX runtime)
- **Testing Library (per framework)** — `@testing-library/react`, `@testing-library/vue`, `@solidjs/testing-library`
- **Playwright 1.61+** — End-to-end testing across Chromium, Firefox, WebKit
- **90%+ Coverage** — Target coverage (add `@vitest/coverage-v8` + `thresholds` to enforce)
- **Playwright E2E Data Prefix** — All E2E test data input MUST use the prefix `from Playwright-E2E`
- **Comprehensive Testing** — Component, API, utility, integration, and E2E tests

### DevOps
- **PNPM 11+** — Fast, efficient package manager (required)
- **Biome.js 2.5+** — Fast formatting and linting
- **Docker Compose** — Local PostgreSQL for Hyperdrive development
- **OpenSpec** — Specification-driven development workflow
- **Wrangler 4.103+** — Cloudflare CLI for development and deployment

### Cloudflare Services
- **D1** — SQLite database at the edge (separate schema in `db/d1/`)
- **Hyperdrive** — PostgreSQL connection pooling (separate schema in `db/hyperdrive/`)
- **KV** — Key-value cache, sessions, inter-DO communication
- **R2** — S3-compatible object storage (commented out in `wrangler.jsonc`; requires a paid plan)
- **Durable Objects** — Stateful WebSocket/SSE, queues (KV for inter-DO coordination); ships an example `Counter` DO
- **Vectorize** — Vector embeddings for ML data models
- **Workers AI** — AI inference and backend automation
- **Browser Rendering** — Server-side browser automation
- **Rate Limiter** — Edge-native request rate limiting

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Initialize OpenSpec](#initialize-openspec)
4. [Environment Setup](#environment-setup)
5. [Database Setup](#database-setup)
6. [Development](#development)
7. [Testing](#testing)
8. [Building & Deployment](#building--deployment)
9. [Project Structure](#project-structure)
10. [Architecture Overview](#architecture-overview)
11. [Cloudflare Services](#cloudflare-services)
12. [Quick Reference](#quick-reference)

---

## Prerequisites

Before starting, ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 24+ LTS | JavaScript runtime |
| **PNPM** | 11+ | Package manager |
| **Docker** | Latest | Local PostgreSQL for Hyperdrive |
| **Wrangler CLI** | Latest | Cloudflare deployments |
| **Git** | Latest | Version control |

### Install Global Tools

```bash
# Install PNPM (if not installed)
npm install -g pnpm

# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare (for deployments)
wrangler login
```

---

## Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd astro-cf-starter
```

### Step 2: Install Dependencies

```bash
pnpm install
```

This installs all project dependencies including:
- Astro + adapters (`@astrojs/cloudflare`, `@astrojs/react`, `@astrojs/vue`, `@astrojs/solid-js`)
- React 19, Vue 3, SolidJS, TypeScript
- TailwindCSS, DaisyUI, Lucide (react / vue / solid)
- Hono, Drizzle ORM, Zod
- Vitest + Testing Library (react / vue / solid), Playwright
- Awilix (dependency injection)

> **Note:** `postinstall` runs `pnpm typecheck` (`wrangler types && tsc -b`), so the first install also generates `worker-configuration.d.ts`.

### Step 3: Install OpenSpec Fission AI (Optional but Recommended)

OpenSpec Fission AI enhances the development workflow with AI-assisted specification management.

```bash
# Install OpenSpec CLI globally
npm install -g @fission-ai/openspec@latest

# Verify installation
openspec --version
```

> **Note:** OpenSpec Fission AI integrates with your IDE (VS Code, Windsurf) for AI-assisted development. See [OpenSpec Documentation](https://openspec.dev) for IDE extensions.

---

## Initialize OpenSpec

OpenSpec provides specification-driven development for consistent, high-quality code.

### Step 1: Review Project Specifications

Read the project context before making changes:

```bash
# View project specifications
cat openspec/config.yaml
```

### Step 2: Understand the Specifications

```
openspec/
├── config.yaml     # Project configuration & context
├── specs/          # Feature specifications
└── changes/        # Change proposals
    └── archive/    # Completed changes
```

**Key files to review:**
- `openspec/config.yaml` — Project configuration, context, and rules

### Step 3: OpenSpec Workflow Commands

When developing features, use OpenSpec workflows:

```bash
# Create a new change proposal
# Use: /opsx:new <change-name> in your AI assistant

# Create all planning artifacts (fast-forward)
# Use: /opsx:ff in your AI assistant
# or
# Create the next artifact (one at a time)
# Use: /opsx:continue in your AI assistant

# Apply approved tasks
# Use: /opsx:apply in your AI assistant
# Validate implementation matches specs (optional)
# Use: /opsx:verify in your AI assistant

# Archive a completed change
# Use: /opsx:archive in your AI assistant
```

---

## Environment Setup

### Step 1: Create Environment File

```bash
cp .dev.vars.example .dev.vars
```

### Step 2: Configure Environment Variables

Edit `.dev.vars` with your settings (it resolves `${...}` placeholders in `wrangler.jsonc` via `scripts/gen-wrangler.js`):

```bash
# .dev.vars (gitignored) — keys auto-discovered from ${...} placeholders in wrangler.jsonc
VALUE_FROM_CLOUDFLARE=your_value_here
KV_ID=your_kv_id_here
D1_DB_ID=your_d1_db_id_here
HYPERDRIVE_DB_ID=your_hyperdrive_db_id_here
VECTORIZE_INDEX_NAME=your_vectorize_index_name_here

# Optional (recommended for CORS/CSRF origin checks)
# CORS_ALLOWED_ORIGINS=http://localhost:4321,https://your-domain.com
```

### Step 3: Start Local Services

Start PostgreSQL for Hyperdrive development:

> **Note:** A `docker-compose.yml` (PostgreSQL for Hyperdrive) ships in the repo. This step is only needed when using Hyperdrive.

```bash
docker-compose up -d
```

Verify the service is running:

```bash
docker-compose ps
```

---

## Database Setup

This project is designed to use **Drizzle ORM** with separate schemas/migrations for:

- **D1** (SQLite)
- **Hyperdrive** (PostgreSQL)

### Step 1: Provision Cloudflare resources

Follow `GUIDE.md` to create D1/Hyperdrive resources and collect their IDs.

### Step 2: Configure bindings for local dev

Add the relevant IDs to `.dev.vars` (or CI variables) so `scripts/gen-wrangler.js` can generate `wrangler.json`.

### Step 3: Start local Postgres for Hyperdrive (optional)

```bash
docker-compose up -d
```

The default local connection string for Hyperdrive is configured in `wrangler.jsonc` under `hyperdrive[].localConnectionString`.

> **Note:** Drizzle Kit configs and the `d1:*` / `db:*` scripts referenced below are not yet defined in `package.json`. Wire them to `drizzle-kit` (and `wrangler d1 migrations apply` for D1) when you add your schemas under `db/d1/` and `db/hyperdrive/`.

---

## Development

### Start Development Server

```bash
pnpm dev
```

This starts:
- **Astro dev server** with HMR at `http://localhost:4321`
- **Cloudflare bindings** emulated locally via the `@astrojs/cloudflare` adapter (D1, KV, etc.)

### Code Quality Commands

```bash
# Run Biome check + auto-fix (lint + format + organize imports)
pnpm lint

# Generate Cloudflare binding types + typecheck (wrangler types && tsc -b)
pnpm typecheck
```

---

## Testing

### Run Tests

```bash
# Run all Vitest tests (unit + integration)
pnpm test

# Run Playwright E2E tests
pnpm test:e2e
```

> **Note:** Only `test` and `test:e2e` exist in `package.json`. For coverage/UI, add
> `@vitest/coverage-v8` plus scripts like `test:cov` (`vitest run --coverage`) and `test:ui` (`vitest --ui`).

### Coverage Requirements

- **Target coverage: 90%** for all metrics (statements, branches, functions, lines)
- To enforce it, add `@vitest/coverage-v8` and a `coverage.thresholds` block to `vitest.config.ts` (not configured yet)
- Tests are located in `__tests__/` directories alongside source files
- Use `*.test.ts` or `*.test.tsx` for unit tests
- Use `*.integration.test.ts` for integration tests
- Use `e2e/*.spec.ts` for Playwright end-to-end tests

### Playwright E2E Convention

- **Data Prefix Constraint:** All data input in Playwright E2E tests MUST use the prefix `from Playwright-E2E`. This applies to names, descriptions, titles, and simulated user-generated content, preventing false confidence by differentiating manually-seeded data from E2E data. Use the `e2eData` and `e2eEmail` helpers defined in `e2e/helpers/test-data.ts`.

---

## Building & Deployment

### Build for Production

```bash
pnpm build
```

### Preview Production Build

```bash
# Build and preview the production output locally (astro build && astro preview)
pnpm preview
```

### Deploy to Cloudflare

```bash
# Upload new version
npx wrangler versions upload

# Deploy version
npx wrangler versions deploy
```

---

## Project Structure

```
├── src/                          # Application source
│   ├── app.ts                    # Hono app + Worker entry; mounts /api/v1, delegates SSR to Astro
│   ├── pages/                    # Astro pages (file-based routing) — e.g. index.astro
│   ├── layouts/                  # Astro layouts — e.g. Layout.astro
│   ├── components/               # UI components
│   │   ├── Welcome.astro         # Astro component
│   │   ├── react/                # React islands (Counter.tsx) — hydrated via client:*
│   │   ├── vue/                  # Vue islands (Counter.vue)
│   │   └── solid/                # SolidJS islands (Counter.tsx)
│   ├── server/                   # Backend (Hono on Cloudflare Workers)
│   │   ├── routes/v1/            # Versioned API endpoints (index.ts)
│   │   ├── durable_objects/      # Durable Object classes (counter.do.ts)
│   │   └── (planned)             # containers/ engines/ services/ middleware/ i18n/ schemas/ types/
│   ├── styles/                   # global.css (TailwindCSS 4 + DaisyUI)
│   └── assets/                   # Imported assets (svg, images)
│
├── db/ (planned)                 # Drizzle schemas/migrations: d1/ (SQLite) + hyperdrive/ (PostgreSQL)
├── shared/ (planned)             # Shared code: types/ schemas/ utils/
│
├── e2e/                          # Playwright end-to-end tests (index.spec.ts)
├── public/                       # Static assets (served as-is)
├── scripts/                      # Utility scripts (gen-wrangler.js)
│
├── openspec/                     # OpenSpec specification files
│   ├── config.yaml               # Project configuration & context
│   ├── specs/                    # Feature specifications
│   └── changes/                  # Change proposals (with archive/)
│
├── astro.config.mjs              # Astro config (output: server, CF adapter, react/vue/solid)
├── biome.json                    # Biome.js configuration (tabs, double quotes)
├── package.json                  # Dependencies and scripts (PNPM)
├── playwright.config.ts          # Playwright E2E configuration
├── tsconfig.json                 # TypeScript config (extends astro/tsconfigs/strict)
├── vitest.config.ts              # Vitest config (vitest/config, jsdom, React JSX runtime)
├── wrangler.jsonc                # Cloudflare Workers configuration
└── worker-configuration.d.ts     # Auto-generated Cloudflare binding types
```

---

## Architecture Overview

This project follows a **clean architecture** with SOLID principles and dependency injection:

```
┌─────────────────────────────────────────────────────────┐
│                  Routes / Controllers                    │
│        (Astro pages + islands / Hono API routes)        │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                 Engine / Facade Layer                    │
│       (Business logic, orchestrates services)            │
│                                                          │
│  • Coordinates multiple services                         │
│  • Contains business rules and validation                │
│  • Transaction boundaries                                │
│  • Only create when orchestration is needed              │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    Service Layer                         │
│         (Direct integration with externals)              │
│                                                          │
│  Backend: D1 │ Hyperdrive │ KV │ R2 │ DO │ Vectorize    │
│          │ AI │ Logger │ Auth                             │
│  Frontend: API │ OAuth │ Payment │ Map │ SmartContract   │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

**Layer Discipline:**
- **Engine Layer** — Business logic orchestration (no direct external calls)
- **Service Layer** — Direct integrations with D1, KV, R2, APIs, etc.
- **No Unnecessary Layers** — Only create engine layer when coordinating 2+ services

**Dependency Injection:**
- **Awilix** — Interface-based DI following [official guide](https://github.com/jeffijoe/awilix/blob/master/README.md)
- **Interface Contracts** — All services must implement interfaces
- **Testability** — Easy mocking and unit testing

**Core Features:**
- **Logger Service** — Centralized logging with correlation ID, sensitive data sanitization
- **Global Error Handling** — Automatic error catching and logging for all API routes
- **CSRF Protection** — Required for all mutations (POST/PUT/PATCH/DELETE)
- **CORS Protection** — Configurable origins via `wrangler.jsonc` variables

**Testing Requirements:**
- **Minimum 90% coverage** for statements, branches, functions, lines
- **Unit tests** — Components, services, utilities (Vitest + Testing Library per framework)
- **Integration tests** — API endpoints, feature flows (Vitest + Hono test client)
- **End-to-end tests** — Full user flows across browsers (Playwright)
- **All tests must pass** before merging

---

## Cloudflare Services

All bindings are defined in `wrangler.jsonc` and auto-typed in `worker-configuration.d.ts` via `wrangler types`.

| Binding | Type | Config Key | Local Dev Status |
|---------|------|------------|------------------|
| `D1` | `D1Database` | `d1_databases` | ✅ Local via Wrangler |
| `HYPERDRIVE` | `Hyperdrive` | `hyperdrive` | ✅ Docker PostgreSQL |
| `KV` | `KVNamespace` | `kv_namespaces` | ✅ Local via Wrangler |
| `R2` | `R2Bucket` | `r2_buckets` | ⚠️ Commented out (paid plan) |
| `DO_COUNTER` | `DurableObjectNamespace` | `durable_objects` | ✅ Local sqlite_classes |
| `VECTORIZE` | `VectorizeIndex` | `vectorize` | ⚠️ `remote: true` |
| `AI` | `Ai` | `ai` | ⚠️ `remote: true` |
| `BROWSER` | `Fetcher` | `browser` | ⚠️ Remote only |
| `LONG_RATE_LIMITER` | `RateLimit` | `ratelimits` | ✅ Local via Wrangler |
| `SHORT_RATE_LIMITER` | `RateLimit` | `ratelimits` | ✅ Local via Wrangler |
| `ASSETS` | `Fetcher` | `assets` | ✅ Local via Wrangler |

> **Note:** `VECTORIZE` and `AI` use `remote: true` — they require an active Cloudflare account even during local development. `R2` is commented out in `wrangler.jsonc` (paid plan); uncomment `r2_buckets` once available. Ensure bindings are provisioned before testing these features.

---

## Quick Reference

```bash
# ─────────────────────────────────────────────────────────
# INSTALLATION
# ─────────────────────────────────────────────────────────
pnpm install                    # Install dependencies
docker-compose up -d            # Start local PostgreSQL

# ─────────────────────────────────────────────────────────
# DEVELOPMENT
# ─────────────────────────────────────────────────────────
pnpm dev                        # Start Astro dev server (http://localhost:4321)
pnpm lint                       # Biome check --write (lint + format)
pnpm typecheck                  # wrangler types && tsc -b

# ─────────────────────────────────────────────────────────
# DATABASE (recommended scripts — not yet defined in package.json)
# ─────────────────────────────────────────────────────────
pnpm d1:studio                  # Open D1 Drizzle Studio
pnpm d1:generate                # Generate D1 migrations (drizzle-kit)
pnpm d1:migrate                 # Apply D1 migrations (drizzle-kit)
pnpm db:studio                  # Open Hyperdrive Drizzle Studio
pnpm db:generate                # Generate Hyperdrive migrations (drizzle-kit)
pnpm db:migrate                 # Apply Hyperdrive migrations (drizzle-kit)

# ─────────────────────────────────────────────────────────
# TESTING
# ─────────────────────────────────────────────────────────
pnpm test                       # Run all Vitest tests
pnpm test:e2e                   # Playwright E2E tests

# ─────────────────────────────────────────────────────────
# BUILD
# ─────────────────────────────────────────────────────────
pnpm build                      # Production build (astro build)
pnpm preview                    # astro build && astro preview

# ─────────────────────────────────────────────────────────
# LOCAL SERVICES
# ─────────────────────────────────────────────────────────
docker-compose up -d            # Start PostgreSQL
docker-compose down             # Stop PostgreSQL
docker-compose logs -f          # View logs
```

---

## Additional Resources

- **OpenSpec Configuration:** `openspec/config.yaml`
- **Detailed Setup Guide:** `GUIDE.md`
- **Astro Docs:** https://docs.astro.build
- **React 19 Docs:** https://react.dev
- **Vue 3 Docs:** https://vuejs.org
- **SolidJS Docs:** https://www.solidjs.com/docs
- **Hono Documentation:** https://hono.dev
- **Cloudflare Workers Docs:** https://developers.cloudflare.com/workers
- **Drizzle ORM Docs:** https://orm.drizzle.team
- **DaisyUI Components:** https://daisyui.com
- **TailwindCSS Form Layouts:** https://tailwindcss.com/plus/ui-blocks/application-ui/forms/form-layouts
- **Awilix Guide:** https://github.com/jeffijoe/awilix/blob/master/README.md
- **Playwright Docs:** https://playwright.dev
- **Vitest Docs:** https://vitest.dev
- **Zod Docs:** https://zod.dev
- **Biome.js Docs:** https://biomejs.dev

---

## License

MIT