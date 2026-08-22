# ADR 0004: One persisted session partition per site

## Status
Accepted, decided at Phase 1 start (the partitioning rule referenced by
CLAUDE.md since project start).

## Context
Phase 1 gives every tab real web content. Cookies, localStorage, and cache
must not leak between different sites, while two tabs on the same site must
see the same login state. Electron's `session.fromPartition()` provides the
isolation mechanism, but nothing in Electron decides what a "site" is or how
partition names are derived.

## Decision
- Partition key: `persist:site-<hostname>` where `<hostname>` is the URL's
  host, lowercased and port-stripped (bracketed IPv6 literals keep their
  colons). The exact derivation lives in `@mine/contracts`
  (`buildSitePartition`) so shell is the implementer, not the inventor.
- `persist:` (not in-memory) so logins survive restarts.
- Chrome pages (`mine://chrome/`, `mine://newtab/`) always use the DEFAULT
  session — never a site partition — and site partitions are never given the
  privileged scheme registration that chrome sessions get.
- Partitions are created lazily: one per site, on first navigation to it,
  attached to the tab's WebContentsView before any load begins.

## Alternatives rejected
- **One shared session**: cross-site cookie leakage; defeats the privacy
  premise of the browser.
- **Per-tab partitions**: breaks same-site identity across tabs (every tab
  would be logged out independently) and multiplies memory cost per tab
  instead of per site.

## Consequences
- Partition count grows with distinct sites visited, not tabs opened.
- Hostname-level grouping means `www.example.com` and `api.example.com`
  currently land in separate partitions. Grouping to the registrable domain
  (eTLD+1) needs a public-suffix library — deferred until a spike picks one;
  this ADR stays the record until then.
- Clearing "all data for this site" later becomes
  `clearStorageData` on exactly one partition — cheap and precise.
- The session must be assigned before the first `loadURL`, or Chromium will
  have already materialized a default session for that view.
