# ADR 0007: Left vertical tab rail

## Status
Accepted.

## Context
The HUD keeps telemetry and shield status in a right-hand rail whose width
(`TELEMETRY_RAIL_WIDTH`) is already a contracts value consumed by both shell
(view bounds) and chrome-ui (CSS). The tab strip originally lived in the
titlebar, which caps it at one row and hides overflow. Moving tabs into a
dedicated left rail gives them room to stack, but the rail would sit *under*
the `WebContentsView` unless the main process reserves that width when it
computes content bounds — a number two packages must agree on byte-for-byte,
which per ADR 0002 belongs in contracts.

## Decision
- `TAB_RAIL_WIDTH` is exported from `packages/contracts/src/layout/constants.ts`.
- `contentBounds` offsets content by `TAB_RAIL_WIDTH` on the left in addition
  to `CHROME_HEIGHT` on top and `TELEMETRY_RAIL_WIDTH` on the right.
- chrome-ui hosts the tab strip in a fixed left rail of exactly
  `var(--hud-tab-rail-width)`, injected from the same constant at build time.
- The left rail is drag-region-free interactive chrome; the titlebar remains
  the window drag surface.

## Alternatives rejected
- **Tabs stay in the titlebar**: overflow hides real tabs with no indication.
- **Left rail as chrome-ui-only overlay without a bounds change**: webviews
  render beneath it; clicks land on the page, not the rail. Silent breakage,
  exactly what ADR 0002 exists to prevent.
- **Reusing TELEMETRY_RAIL_WIDTH for both sides**: couples two independent
  layout decisions; resizing one would silently move the other.

## Consequences
- Every consumer of `contentBounds` gets the narrower content area at once;
  there is no gradual migration path, matching how CHROME_HEIGHT behaves.
- The vite injection plugin must define `--hud-tab-rail-width` alongside the
  existing variables; tokens tests assert this so drift is caught in CI.
