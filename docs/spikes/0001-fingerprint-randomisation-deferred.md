# Spike 0001: Fingerprint randomisation in Electron — deferred

## Question
Can canvas/WebGL/audio fingerprint readbacks be randomised per session
without weakening `contextIsolation`?

## Findings (analysis, Phase 2 planning)
Candidate mechanisms examined:

1. **Preload-injected overrides** — preloads run in an isolated world; their
   objects do not replace page-world natives. Making them visible to the
   page requires disabling `contextIsolation`, which is a forbidden security
   regression.
2. **`webContents.executeJavaScript` after load** — racy: page scripts may
   have already fingerprinted before injection lands. Coverage gaps for
   workers and iframes make the protection partial while appearing complete
   — dishonest by rule 7.
3. **CDP via `webContents.debugger`
   (`Page.addScriptToEvaluateOnNewDocument`)** — technically injects before
   page scripts without weakening isolation, but attaching the debugger is a
   heavyweight, detectable, single-client global side effect for every tab,
   and worker/service-worker coverage still needs verification.
4. **Chromium source patch** — forbidden outright by CLAUDE.md ("we never
   fork or patch it").

## Decision
Deferred. Mechanism 3 is the only viable path and carries real costs that
deserve a dedicated spike with benchmarks before adoption. Recorded here so
Phase 2 ships honestly without it, per ROADMAP's conditional.

Revisit trigger: post-Phase-7, or if Brave/Chromium ships a supported API.
