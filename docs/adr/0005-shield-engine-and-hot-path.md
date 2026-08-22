# ADR 0005: Shield engine boundary and hot-path discipline

## Status
Accepted, decided at Phase 2 start.

## Context
Shield runs on every network request the browser makes — thousands per page
load, with a hard budget of under 1 millisecond at p99 measured against the
full filter set (CLAUDE.md). It must also respect the licensing architecture
in THIRD_PARTY_NOTICES.md: engine ships, data is fetched at runtime.

## Decision
- **Engine**: `adblock-rust` wrapped in a Rust crate under
  `packages/shield/native`, exposed through NAPI-RS. TS never links C.
- **Hot path**: `checkRequest(url, sourceHostname, resourceType)` is a
  synchronous NAPI call returning the plain `RequestVerdict` from contracts.
  No zod, no promises, no validation on this path — compile-time types only,
  per CLAUDE.md's deliberate asymmetry.
- **Data**: EasyList, uBO lists, and DuckDuckGo Tracker Radar are fetched at
  runtime into `.shield-cache/` (gitignored), never bundled. With no bundled
  fallback there MUST be an honest named state (`failed`, `loading`) surfaced
  to the UI rather than a silently unprotected browser.
- **Param stripping**: a pure function in shield's TS facade; shell applies it
  during navigation before any load begins. Strip list is shield-owned data.
- **Stats**: shell aggregates verdicts per tab and emits
  `mine:shield:stats-updated` (zod-validated at that IPC boundary).
- **Benchmark gate**: lookup latency measured against the full loaded list
  set; p50/p90/p99/p99.9/max recorded in the phase report. "Under 1ms"
  claimed only with numbers attached.
  - *Amendment (Phase 2 ship)*: implemented as a deterministic percentile
    harness (`native/examples/lookup-bench.rs`, `cargo run --release --example
    lookup-bench`) instead of criterion — criterion reports means/medians but
    not tail percentiles, and this gate is specifically about the tail.
    Individual per-request timings include `Request` construction, matching
    the production call path.

## Alternatives rejected
- **A JS/WASM filter engine in-repo**: reinvents what adblock-rust already
  solves; memory and CPU costs of JS parsing are exactly what the budget
  forbids.
- **Bundling lists for offline cold-start**: reopens GPL-3.0/CC-BY-SA
  distribution terms (THIRD_PARTY_NOTICES.md) — forbidden without revisiting
  that file first.
- **Async hot path**: every request would pay promise scheduling; the budget
  dies quietly.

## Consequences
- CI gains a Rust job (cargo test/clippy); Node-only CI is no longer
  sufficient for the workspace.
- First run without network = honest degraded mode, visibly stated.
- Fingerprint randomisation remains deferred per the pre-Phase-2 spike record
  (docs/spikes/0001) unless a future spike overturns it.
