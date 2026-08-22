# Roadmap

Each phase must be shippable on its own. Do not start a phase until the
previous one's tests pass and the reviewer has signed off.

- **Phase 0 — contracts + toolchain.** Types, IPC channels, shared layout
  constants (including chrome height), package skeleton, CI, GitHub remote
  configured and CI actually executing once. Rust toolchain verified. ADR for
  the `mine://` custom protocol decided now. No features.
- **Phase 1 — shell.** Window, tab strip, WebContentsView lifecycle, address
  bar, history, per-tab session partitions. A working, ugly browser served
  over `mine://chrome/`, not `file://`.
- **Phase 2 — shield.** adblock-rust + filter lists (fetched at runtime, never
  bundled) + tracker radar + param stripping + fingerprint randomisation IF a
  spike confirms it's technically deliverable without weakening
  contextIsolation — otherwise deferred with the spike as the record. Counter
  in the UI.
- **Phase 3 — chrome-ui HUD.** The full HUD design. Design tokens, radial
  dashboard new-tab page, arc-geometry tabs, telemetry rail, panel
  transitions. Replaces the ugly chrome from Phase 1. Frameless window
  decision made here, with CHROME_HEIGHT already a contract value so this
  phase amends one place, not three.
- **Phase 4 — fetcher.** Segmented downloader with resume. Torrent after.
- **Phase 5 — media.** Stream sniffing, native player, PiP.
- **Phase 6 — search.** SearXNG client, rank fusion, rerank, facet inference.
- **Phase 7 — safety.** Safe browsing, phishing lists, scam heuristics.
- **Phase 8 — decentralised.** ipfs:// handler, EIP-1193 provider, ENS.
