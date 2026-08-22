# Third-party notices

`mine` is MIT licensed (see LICENSE). It depends on and consumes third-party
software and data under other licences. This file records what those are and
what they oblige. **This is a record, not legal advice.**

## mine is a non-commercial project — decided at project start

This is a deliberate, load-bearing decision, not an afterthought. DuckDuckGo's
Tracker Radar dataset — used for tracker entity classification — is licensed
under **CC BY-NC-SA 4.0**: Attribution, ShareAlike, and **NonCommercial**.

Consequences, accepted knowingly:
- Paid tiers, paid support, commercial distribution, or any monetisation of
  this project require a separate licence from DuckDuckGo (available on
  request per their README).
- ShareAlike reaches **derived data**: any transformed index or precomputed
  lookup built from Radar is itself a derivative and carries CC BY-NC-SA 4.0.
  This constrains how the shield package stores its entity table — loaded
  from fetched data at runtime, never compiled into the binary — so MIT code
  and CC BY-NC-SA data stay separable.
- If this project ever needs to become commercial, the fix is replacing or
  licensing Tracker Radar — not relaxing this notice.

## Dependencies and their obligations

| Component | License | Obligation | How we comply |
|---|---|---|---|
| Electron 37.10.3 | MIT | Include copyright + permission notice in distributions | NOTICE generated at packaging time (Phase 3+); recorded here meanwhile |
| React + React DOM 19.x | MIT | Include copyright + permission notice in distributions | Bundled into chrome renderer bundle; NOTICE at packaging time |
| zod 4.4.3 | MIT | Include copyright + permission notice in distributions | Bundled into app bundle; NOTICE at packaging time |
| esbuild, Vite, @vitejs/plugin-react, TypeScript, vitest, pnpm | MIT / MIT / MIT / Apache-2.0 / MIT / MIT | Toolchain only, never ships in the installer | Dev machine and CI exclusively |
| adblock-rust | MPL-2.0 | File-level copyleft on modified files | Consumed as a dependency, not forked |
| EasyList | CC BY-SA 3.0 | Attribution, share-alike on redistribution | Fetched at runtime, never bundled |
| uBlock Origin filter lists | GPL-3.0 | Attribution, share-alike on redistribution | Fetched at runtime, never bundled |
| DuckDuckGo Tracker Radar | CC BY-NC-SA 4.0 | Attribution, non-commercial, share-alike | Fetched at runtime, non-commercial project |

**Runtime fetching is the load-bearing decision that keeps this simple.** The
installer ships the *engine* only. Filter lists and Tracker Radar data are
downloaded on first run and cached locally — we never redistribute the
copyrighted list data itself, so GPL-3.0's and CC BY-SA's distribution terms
never attach to the installer. **Shipping any bundled fallback list — even
for cold-start-with-no-network — reopens this and must not be done without
revisiting this file.**
