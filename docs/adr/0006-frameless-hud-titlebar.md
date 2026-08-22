# ADR 0006: Frameless window — the HUD is the title bar

## Status
Accepted, decided at Phase 3 start (as ROADMAP scheduled).

## Context
The HUD design makes the browser chrome the title bar: arc tabs, radial
dashboard, telemetry rail. A native OS title bar above that would be visual
dead weight — but removing it transfers every window management duty to us.
CHROME_HEIGHT already lives in contracts (ADR 0002) so this decision amends
one constant, not three packages' guesses.

## Decision
- `frame: false` — fully custom top bar. No native controls remain.
- Window management crosses to the renderer via three new invoke channels
  (`mine:shell:minimize-window`, `mine:shell:toggle-maximize-window`,
  `mine:shell:close-window`) plus a `window-state-changed` event so the UI
  renders the correct maximize glyph after Win+Up/Down, snap, or restore.
- Drag regions are CSS (`-webkit-app-region: drag`) on designated strips only;
  interactive elements are explicitly `no-drag`. Double-click-to-maximize
  comes free with a correctly-sized drag strip.
- **CHROME_HEIGHT amends 40 → 44** in contracts, single source, effective
  immediately for shell view bounds and hud-designer's bar layout.

## Alternatives rejected
- **`titleBarStyle: 'hidden'` + `titleBarOverlay`**: keeps native window
  controls, but reserves an opaque overlay rectangle in a corner we don't
  control, conflicts with arc geometry near the bar's end, and its snap-layout
  flyout only works over the native region anyway.
- **Keeping the native frame**: rejected by the phase's premise.

## Consequences
- Windows 11 snap-layout flyout (hover over maximize) is lost — plain snap
  via Win+arrows still works. Accepted; not emulated this phase.
- Minimize/maximize/close buttons need real focus states and keyboard
  operability — accessibility is ours now, not the OS's.
- The drag strip must never cover interactive chrome (tabs, address input);
  reviewer should treat misplaced drag regions as bugs.
- Shell must emit state changes it didn't cause (Win+Down from the taskbar)
  by listening to its own window events, or the maximize glyph lies.
