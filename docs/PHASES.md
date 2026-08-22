# The 9 Phases — What Each One Actually Builds

## Phase 0 — Contracts + Toolchain

**The idea:** before any package writes a line of feature code, define every type, IPC channel, and shared constant that more than one package will need. This is the single decision that makes the whole multi-agent approach work — if `shell` and `chrome-ui` each independently guess what a "tab" looks like, they'll guess differently, and you won't find out until they're wired together and something's silently wrong.

**What actually gets built:** no features. Just `packages/contracts` — TypeScript types like `TabSnapshot`, `NavigationState`, `AppError`; IPC channel name constants like `mine:shell:navigate`; zod schemas that validate data crossing the process boundary; and now (learning from v1) shared layout constants like chrome height, so nobody hand-copies a number into three files.

**Why it's a whole phase and not a preamble:** because "quick, just wire this up" is exactly how a browser ends up with three different definitions of how tall the toolbar is. Spending real time here — with an ADR for every non-obvious decision — is what lets Phase 1 through 8 run without agents contradicting each other.

**Exit criteria:** contracts package builds, typechecks, has tests, and — new this time — a GitHub remote is configured and CI has actually run once on real hardware, not just locally.

---

## Phase 1 — Shell

**The idea:** the absolute minimum that deserves to be called a browser. One window, tabs that open and close, an address bar that navigates, back/forward, and each tab's cookies isolated from the others. Deliberately ugly — native window frame, placeholder HTML, no styling effort at all.

**What actually gets built:** the Electron *main process* — the part that isn't a webpage, the part that manages windows and talks to the OS. `WebContentsView` per tab (Electron's current API, not the deprecated `BrowserView`), a `session.fromPartition()` per site so cookies don't leak between sites, IPC handlers that validate every message from the renderer before acting on it, and a preload script that exposes exactly the commands the renderer needs and nothing more — no back door to Node.js.

**Why ugly matters here:** you cannot debug whether tabs work correctly at the same time as debugging whether they *look* correct. Separating "does the plumbing work" from "is it beautiful" means when something breaks, you know which half broke.

**The trap this phase exists to catch:** Electron security is easy to get subtly wrong — `nodeIntegration` left on, a preload that forwards more than it should, content loaded without sandboxing. A privilege-escalation bug through a wrongly-typed event listener was caught by review in v1's Phase 1. This phase is where that class of bug either gets caught or ships.

---

## Phase 2 — Shield

**The idea:** the first feature that makes this actually a *different* browser rather than a rebuilt Chrome. Ad blocking and tracking protection, built on `adblock-rust` (the real engine Brave uses) rather than reinventing filter-list parsing.

**What actually gets built:** a Rust crate wrapping `adblock-rust`, exposed to the TypeScript side through a NAPI binding. It loads EasyList and uBlock Origin's filter rules, plus DuckDuckGo's Tracker Radar for classifying *who* is tracking you (not just blocking a URL, but knowing "this is a Facebook pixel" vs "this is an ad network"). URL parameter stripping (`utm_*`, `fbclid`) on navigation. A stats system that counts blocks per tab and reports them to the UI.

**The performance idea that shapes everything:** this code runs on *every single network request* the browser makes — potentially thousands per page load. The budget is under 1 millisecond per lookup at the 99th percentile. That constraint is why shield's decision type carries no validation overhead on the hot path — zod stays at the IPC boundary, never in the request loop. Get this wrong and the browser feels sluggish on every page.

**The honest failure of this phase (and it's instructive):** fingerprint randomisation — making your canvas/WebGL/audio fingerprint different each session — was planned for Phase 2 but a spike proved it's not achievable without weakening Electron's `contextIsolation` security boundary. The right move was documenting that and deferring the feature, not forcing something that trades security for a feature. That's the kind of decision this phase structure is designed to surface *before* code gets built around a broken assumption.

---

## Phase 3 — Chrome-UI HUD

**The idea:** this is where the browser stops being functional-but-ugly and becomes the thing you actually designed — the radial dashboard, arc-shaped tabs, the telemetry rail with segmented gauges, cinematic panel transitions. Phase 1's placeholder HTML gets thrown away entirely.

**What actually gets built:** the React renderer, rebuilt from scratch. A frameless window (no OS title bar — the HUD *is* the title bar), the new-tab page as a radial dashboard with feature nodes you click into, tabs following an arc geometry instead of a flat strip, a telemetry sidebar showing CPU/GPU/RAM/network and shield's block count in real time.

**Why this comes *after* shield, not before:** the telemetry rail needs real data to display — shield's block count, network stats. Building the beautiful UI before the data exists means either faking numbers (which CLAUDE.md's rules explicitly forbid) or building the visuals twice.

**Why this comes after shell, not merged into it:** Phase 1 proved the plumbing works — tabs open, navigation happens, sessions isolate. Debugging *that* at the same time as debugging CSS animations and SVG geometry would mean never knowing which layer broke. Sequencing them means Phase 3 is purely "make the working thing beautiful," a much easier problem than "build and beautify simultaneously."

**The specific design discipline:** motion is restricted to `transform` and `opacity` only — never properties that trigger browser layout recalculation — with a hard 200ms ceiling on any transition. And restraint on *where* the full HUD treatment applies: the new-tab dashboard and telemetry rail get the full cinematic treatment, but the tab strip and address bar — things you look at for eight hours a day — stay comparatively quiet. A UI that's spectacular for five minutes and exhausting for eight hours has failed at being a daily-use browser.

---

## Phase 4 — Fetcher

**The idea:** a download manager that's actually faster than a single HTTP request, the way IDM (Internet Download Manager) used to be — by splitting one file into multiple parallel segments.

**What actually gets built:** a segmented downloader — probe the server with a HEAD request, check if it supports byte-range requests, and if so, split the file into N parallel streams that each download part of it, then merge them on completion. Real resume-from-crash (tested by literally killing the process mid-download and verifying the file reassembles correctly, not just "looks resumable"). Plus a torrent client using `libtorrent-rasterbar` — a real, mature library, not a from-scratch implementation.

**The subtlety:** most servers don't advertise range support reliably, and some lie about it. This phase's real engineering is in the fallback logic — detecting when segmented download genuinely isn't possible and gracefully falling back to a single stream, rather than a downloader that silently corrupts files on servers that don't cooperate.

---

## Phase 5 — Media

**The idea:** click any video on any webpage, and instead of it playing in the cramped, feature-poor `<video>` tag the website gave you, it hands off to a real native media player — variable speed, external subtitle files, frame stepping, A-B loop.

**What actually gets built:** a content script that watches pages for video/audio elements and streaming manifests (HLS `.m3u8`, DASH `.mpd`), and when found, captures the current playback position and hands it to an embedded `libmpv` (or `libvlc` as fallback) process running *outside* the browser's process — so if the codec crashes on some weird file, it doesn't take your whole browser down with it.

**The deliberate limitation:** DRM-protected streams (Widevine, FairPlay) are explicitly detected and left alone — the player does nothing to them. This isn't a missing feature, it's a legal and ethical line the project won't cross.

---

## Phase 6 — Search

**The idea:** since Google's public search API is restricted to site-specific search and Bing's API was discontinued, the path to a genuinely better search experience is aggregation and re-ranking rather than building a crawler from scratch.

**What actually gets built:** a client for a self-hosted SearXNG instance (which itself aggregates many engines), a query-expansion step using a free-tier LLM to generate several search variants from one query, reciprocal rank fusion to merge results from different engines, then a local embedding model to re-rank the merged list against what the user actually meant. The genuinely novel part is dynamic facet inference — detecting from a page's structured data (schema.org markup) whether a search is about shopping, video, or something else, and automatically surfacing the right filters (size/color for a shirt search, nib width for a pen search) without hand-coding a taxonomy for every product category.

**Why this is harder than it sounds:** every external dependency here — the LLM, the search backend — is flaky or rate-limited by nature. The engineering isn't "call an API," it's "call an API that will sometimes fail or be slow, and degrade gracefully rather than showing a blank page." Every dependency needs a timeout and a cache, with a hard latency budget even when upstream is slow.

---

## Phase 7 — Safety

**The idea:** phishing and malware protection that doesn't compromise the privacy the rest of the browser is built around.

**What actually gets built:** Google Safe Browsing integration using the **Update API** — a locally-cached hash-prefix database that gets refreshed periodically — explicitly *not* the Lookup API, which would send every URL you visit to Google in real time. That distinction is the whole point of this phase: a naive implementation would quietly defeat the browser's entire privacy premise. Plus phishing/malware URL lists (URLhaus, OpenPhish) and lightweight heuristics for scam pages — brand-lookalike domains, fake urgency countdowns.

---

## Phase 8 — Decentralised

**The idea:** support for the web that doesn't run through traditional DNS and HTTP — IPFS, Ethereum wallet interactions, ENS domain names (`vitalik.eth` instead of an 0x address).

**What actually gets built:** an `ipfs://` protocol handler (via a Helia node, similar architecture to the `mine://` scheme decided in Phase 0), an EIP-1193 wallet provider injected into pages so dApps can request signatures, and ENS resolution so `.eth` names work in the address bar.

**Why it's last:** every prior phase adds a new URL scheme, a new content type, or a new trust boundary that this phase's protocol handlers need to coexist with — most concretely, the same containment/traversal-safety pattern established for `mine://` in Phase 0 applies again here, so this phase is cheaper to build once that pattern is proven three or four times over in earlier phases.

---

## The throughline across all nine

Every phase follows the same shape: define the contract first, build the minimum honest version, verify it under real load (not assumed), and defer or document anything the team can't deliver truthfully rather than faking it. The phases that went well in the first build (shield's benchmark, the security reviews) succeeded because that discipline was followed. The phases that cost rework (the license decision, the chrome-height triple-write, the `file://` wall) were exactly the places where a later phase discovered something a Phase 0 decision would have prevented — which is the whole reasoning behind restructuring Phase 0 the way the v2 scaffold does.
