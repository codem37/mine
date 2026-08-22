# ADR 0001: Serve the chrome renderer over mine://, not file://

## Status
Accepted, decided at project start (Phase 0), not mid-build.

## Context
The chrome renderer is built with Vite and shipped as an ES module bundle.
Electron's `loadFile()` serves content over the `file://` scheme.

## Decision
Register `mine:` as a **standard, privileged** custom protocol via
`protocol.registerSchemesAsPrivileged` before `app.whenReady()`. Serve the
chrome bundle at `mine://chrome/` and the internal new-tab page at
`mine://newtab/`, using `protocol.handle()` (not the deprecated
`registerFileProtocol`), never `loadFile()` for anything that needs to run
a module script.

## Alternatives rejected
- **`file://` via `loadFile()`**: `file://` origins are opaque in Chromium.
  Opaque origins cannot load `<script type="module">` because module loading
  requires CORS, which an opaque origin cannot satisfy. The result is a
  window that opens and silently runs nothing — no error surfaced anywhere.
  This is a known landmine for any Electron+Vite+ESM project; deciding
  against it now avoids rediscovering it mid-build.
- **Disabling ESM / using IIFE bundles**: works around the problem instead of
  solving it, and loses code-splitting.

## Consequences
- Every session that will serve `mine:` content must register the handler —
  including per-partition sessions for tab views if any internal page is
  ever served inside a tab (it must NOT be served to sessions that render
  untrusted content — scope registration per session deliberately).
- Asset serving needs a real traversal-safety check (`path.resolve` +
  `path.relative`, never `startsWith`) once serving a bundle directory rather
  than a single file.
- The bundle's own CSP (meta tag) governs script/style sources; no second CSP
  header should be set on top of it — two policies intersecting is a
  debugging nightmare.
