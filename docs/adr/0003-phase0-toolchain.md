# ADR 0003: Phase 0 toolchain — pnpm workspaces, per-package tsc, vitest

## Status
Accepted, decided during Phase 0.

## Context
The monorepo has eight packages across TypeScript and Rust. Phase 0 must make
`pnpm -r build`, `pnpm -r typecheck`, and `pnpm -r test` meaningful before any
feature package exists, and CI must run the same commands on real hardware.

## Decision
- **pnpm workspaces** with `packages/*` globs; no meta-framework on top.
- **Per-package `tsc` builds**, each package owning its `tsconfig.json`
  extending the root `tsconfig.base.json`. No bundler anywhere yet — Electron
  main and renderer bundling decisions belong to their phases.
- **ESM everywhere** (`"type": "module"`) with `NodeNext` resolution;
  relative imports carry `.js` extensions.
- **vitest** for TypeScript tests. It runs TS directly, so packages do not
  need a build before their tests execute.
- **zod v4** as contracts' only runtime dependency. Schemas exist for IPC
  payloads only, per CLAUDE.md's hot-path exception.
- **GitHub Actions on ubuntu-latest** running install (frozen lockfile),
  build, typecheck, test for every push and PR.

## Alternatives rejected
- **Turborepo / nx**: caching and task-graph machinery sized for teams far
  larger than this project; pnpm's recursive scripts are sufficient at eight
  packages.
- **jest**: heavier config for ESM + TypeScript than vitest, no benefit here.
- **A single root tsconfig building everything**: couples packages' compile
  boundaries and invites cross-package imports that bypass the published
  `@mine/contracts` entry point.

## Consequences
- The lockfile is committed; CI installs with `--frozen-lockfile`.
- Node floor is 20, enforced by `engines` and the CI matrix.
- Every package must define `build`, `typecheck`, and `test` scripts as it
  comes into existence, or the quality gate's recursive commands silently
  skip it.
