# mine — a HUD-styled privacy browser

## What this is
An Electron-based browser with a heads-up-display aesthetic. Chromium is the
engine; we never fork or patch it. Everything we build sits above it.

**This is a non-commercial project.** See THIRD_PARTY_NOTICES.md — Tracker
Radar's CC BY-NC-SA 4.0 licence makes this load-bearing, not aspirational.

## Non-negotiable rules

1. **`packages/contracts` is the law.** Every cross-package type, IPC channel
   name, event payload, and shared constant lives there. No package may define
   its own copy of a shared type. Only the `architect` agent may edit
   `contracts`. This includes layout constants two packages must agree on
   (chrome height, window chrome dimensions) — if two packages need the same
   number, it belongs in contracts, not in both packages by hand.
2. **Stay in your package.** You may READ anything. You may WRITE only inside
   the package you own plus its tests. If you need a change outside it, stop
   and report what you need — do not reach across.
3. **If the contract is wrong, stop.** Do not work around a bad type. Report it
   and let the architect amend `contracts` first.
4. **No secrets in code.** All keys via `process.env`, documented in
   `.env.example`. Never commit `.env`.
5. **Trademarks.** Never use Marvel/Disney names or marks — no "Stark",
   "JARVIS", "arc reactor", no Iron Man imagery. The visual language (cyan-on-
   black HUD, radial gauges, segmented bars) is ours to use; the names are not.
6. **Legality.** We do not ship DRM circumvention. Stream sniffing is for
   playback of already-accessible media. Torrent is a protocol, not a content
   source — no indexes bundled. No filter lists or tracker data are ever
   bundled in the installer — always fetched at runtime (see THIRD_PARTY_NOTICES.md).
7. **No unhonest numbers.** If a metric can't be produced truthfully (page
   load progress, an ETA shield can't calculate), don't fake it with a
   plausible-looking number. Use named states/milestones instead.

## Architecture

| Package | Owns | Language |
|---|---|---|
| `contracts` | shared types, IPC channel constants, zod schemas, cross-package layout constants | TS |
| `shell` | Electron main process, windows, tabs, sessions, protocol handlers | TS |
| `chrome-ui` | renderer: HUD chrome, new tab, settings | TS/React |
| `shield` | adblock + tracking protection engine, NAPI addon | Rust + TS |
| `fetcher` | segmented downloader, torrent client | Rust + TS |
| `media` | player embed, stream sniffing | TS + C bindings |
| `search` | metasearch, rank fusion, rerank, facet inference | TS |
| `safety` | safe browsing, phishing and scam heuristics | TS |

Tabs use `WebContentsView`, never `BrowserView` (deprecated). Each tab gets a
`session.fromPartition()` so cookie jars can be isolated per site — the exact
partitioning rule will be its own ADR, numbered when Phase 1 actually needs
it. Do not pre-number ADRs for decisions that have not been made.

The chrome renderer is served over the `mine://` custom privileged scheme
(standard, not `file://`) — see ADR 0001. Other accepted ADRs: 0002
(shared layout constants live in contracts), 0003 (Phase 0 toolchain).
`file://` gives an opaque origin,
which blocks `<script type="module">`, which breaks any Vite/ESM-built
renderer. This is decided now so nobody rediscovers it mid-build.

## Conventions
- TypeScript strict, ESM throughout (`"type": "module"`). No `any` — use
  `unknown` and narrow.
- Rust crates expose a NAPI-RS binding; TS never links C directly.
- Errors are values at package boundaries: `Result<T, AppError>`, no throwing
  across IPC.
- Every package has `pnpm test`. A task is not done until its tests pass.
- Conventional commits. One package per commit where possible.
- zod validates at the IPC boundary ONLY. Hot-path, in-process, per-request
  values (e.g. shield's block/allow decision) are NOT parsed with zod — they
  are type-checked at compile time. Validating every request would blow the
  1ms shield budget. This asymmetry is deliberate; don't "fix" it by adding
  validation to the hot path, and don't remove it from the IPC boundary either.

## Performance budget
- Cold start to first paint: under 1.2s
- Tab switch: under 80ms
- Animate only `transform` and `opacity`. Never `width`, `height`, `top`, `left`.
- Any transition longer than 200ms is a bug.
- Shield lookup must be under 1ms per request at p99, measured with a real
  benchmark against the full filter list set — not assumed, not a
  microbenchmark against a short list.

## Toolchain
- Node 22.13+, pnpm 11. pnpm 11 requires Node >=22.13 internally (uses
  node:sqlite for its store index) — this isn't a project choice, it's a hard
  floor pnpm imposes.
- Rust via rustup, needed from Phase 0 (shield uses it in Phase 2, but verify
  `cargo` resolves now — PATH issues after a fresh rustup install are common
  and easy to catch early)
- A GitHub remote MUST be configured before Phase 0 is considered done. CI
  running on a real machine (not this dev machine) is how Electron smoke
  tests actually execute if Smart App Control or similar blocks local runs.

## Current phase
Phase 2. See docs/ROADMAP.md. Do not build ahead of the current phase.
