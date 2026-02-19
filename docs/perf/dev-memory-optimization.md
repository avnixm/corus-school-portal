# Dev Server Memory Optimization Report

This document records baseline measurements, root cause hypotheses, changes applied, and results for reducing Next.js dev server RAM usage (target: &lt;4GB).

---

## 1. Baseline Measurements (Before Changes)

**Environment**

- **Node**: Run `node -v` and record (e.g. v20.x).
- **Next.js**: 16.1.6
- **OS**: Linux 6.18.9-200.fc43.x86_64 (or run `uname -a`)

**RAM measurement method**

Use a consistent method. Example on Linux:

```bash
# RSS of the next dev process (MB)
ps -o rss= -p $(pgrep -f "next dev") | awk '{printf "%.0f MB\n", $1/1024}'
```

If multiple Node processes exist, use the main `next dev` PID from `ps aux | grep next`.

**Measurement points** (record MB for each)

| Point | When | RAM (MB) |
|-------|------|----------|
| 1. Initial start | Right after `npm run dev` (wait for "Ready") | TBD |
| 2. After navigation | After opening 3–5 major routes (admin, registrar, student, program-head, finance) | TBD |
| 3. After HMR | After 3–5 file saves to trigger hot reload | TBD |

Fill in "TBD" with your measurements before applying the optimizations below.

---

## 2. Root Cause Hypotheses (Based on Codebase)

| Hypothesis | Evidence |
|------------|----------|
| **Pool recreated on HMR** | `lib/db.ts` created `new Pool()` at top level with no `globalThis` caching in dev, so each hot reload could create a new Neon pool. |
| **Tailwind scanning too much** | No `@source` in Tailwind v4 → whole repo scanned (db/, scripts/, drizzle/, lib/) instead of only UI paths. |
| **Preload entries on start** | Next.js default `experimental.preloadEntriesOnStart: true` preloads all page modules at server start, increasing initial RAM. |
| **Turbopack vs Webpack** | Next 16 uses Turbopack by default; memory may differ. Compare with `next dev --webpack` to document. |
| **Single DB entrypoint** | One page imported `@/db`, rest `@/lib/db`; consolidating to one singleton avoids duplicate driver usage. |

---

## 3. Changes Applied

### O5 – DB client singleton

- **Why**: Avoid creating a new Neon `Pool` on every HMR; reuse one connection pool in dev.
- **What changed**: In `lib/db.ts`, use a dev-only singleton (e.g. `globalThis.__dbPool` / `globalThis.__db`) so the same pool/drizzle instance is reused across hot reloads. Student dashboard updated to import from `@/lib/db` instead of `@/db`.
- **How to verify**: Run `npm run dev`, load student dashboard and another portal route, trigger HMR; confirm no duplicate pools (app should behave normally; optional dev log can confirm single init).

### O2 – Next.js memory flags

- **Why**: Reduce initial memory footprint by not preloading all entries at server start.
- **What changed**: In `next.config.ts`: `experimental.preloadEntriesOnStart: false`. Optionally `experimental.webpackMemoryOptimizations: true` when using `next dev --webpack`.
- **How to verify**: `npm run dev` starts; navigate major routes; no runtime errors; re-measure RAM at same three points.

### O4 – Tailwind v4 scanning scope

- **Why**: Limit Tailwind to UI source only so it does not scan db/, scripts/, drizzle/, non-UI lib/.
- **What changed**: In `app/globals.css`, use `@import "tailwindcss" source(none);` and explicit `@source "./**/*.{ts,tsx}"` and `@source "../components/**/*.{ts,tsx}"` (paths relative to the stylesheet).
- **How to verify**: Run dev and `npm run build`; visually check portal, student, admin pages for missing styles; adjust `@source` if needed.

### O1 – Turbopack vs Webpack (measurement)

- **Why**: Document whether Turbopack or Webpack uses less RAM on this project.
- **What changed**: Added `dev:webpack` script. Baseline is with default Turbopack; optional comparison with `npm run dev:webpack`.
- **How to verify**: Run `npm run dev` and `npm run dev:webpack` at same measurement points; record in Results.

### O3 – Scripts: typecheck and lint separate from dev

- **Why**: Keep `npm run dev` from ever running typecheck/lint in the same process.
- **What changed**: Added `typecheck` script (`tsc --noEmit`). Lint already separate. CI should run both; dev runs only `next dev`.
- **How to verify**: `npm run typecheck` and `npm run lint` work; `npm run dev` still only runs `next dev`.

### O8 – Dev memory toolbox

- **Why**: Make it easy to profile and debug memory (heap snapshots, debug build).
- **What changed**: Added `dev:inspect` (NODE_OPTIONS='--inspect' next dev) and `build:mem` (next build --experimental-debug-memory-usage). Documented below.
- **How to verify**: `npm run dev:inspect` starts and is attachable in Chrome; `npm run build:mem` runs and prints memory info.

---

## 4. Results (After Changes)

Use the **same** measurement method and three points as in Baseline.

| Point | When | RAM before (MB) | RAM after (MB) |
|-------|------|------------------|----------------|
| 1. Initial start | After `npm run dev` ready | TBD | TBD |
| 2. After navigation | 3–5 major routes | TBD | TBD |
| 3. After HMR | 3–5 file saves | TBD | TBD |

**Before vs After**: Fill in after running measurements. Target: meaningful reduction; aim for &lt;4GB where achievable.

---

## 5. Remaining TODOs

- If Turbopack remains &gt;4GB after these changes, try `npm run dev:webpack` and document which bundler uses less RAM.
- Optional: consider dynamic import for `@react-pdf/renderer` in PDF button components to reduce client bundle and dev parse cost.

---

## 6. Dev Memory Toolbox

### Heap snapshots (dev)

1. Run: `npm run dev:inspect`
2. Open Chrome → `chrome://inspect` → click "Open dedicated DevTools for Node".
3. In the Node DevTools, go to **Memory** tab → take **Heap snapshot**.
4. Use snapshots to find retainers and large objects (e.g. filter by "Pool", "drizzle", "webpack", "turbopack").

### Build memory debug

- Run: `npm run build:mem`
- Next.js will print heap usage and GC stats during the build. Use this to see where memory spikes (e.g. during "Running TypeScript" or specific route compilation).

### Commands reference

```bash
npm run dev              # Turbopack (default)
npm run dev:webpack      # Webpack (comparison)
npm run dev:inspect      # Dev with Node inspector (attach Chrome)
npm run build:mem        # Build with memory debug output
npm run typecheck        # TypeScript only
npm run lint             # ESLint only
```

### RAM measurement (Linux)

```bash
ps -o rss= -p $(pgrep -f "next dev") | awk '{printf "%.0f MB\n", $1/1024}'
```
