# ADR 0002: Shared layout constants live in contracts

## Status
Accepted, decided at project start.

## Context
Numbers that two packages must agree on byte-for-byte (chrome height, window
minimum dimensions) are easy to define independently in each package and
easy to let drift, because disagreement is silent — it looks like a dead
strip of UI or content sliding under chrome, never like an error.

## Decision
Any numeric or layout constant that more than one package needs identically
lives in `packages/contracts`, imported by every consumer. It is exported as
a named constant, never re-typed as a magic number.

## Alternatives rejected
- **Defining it in the "owning" package and letting others hardcode a copy**:
  this is exactly the failure mode being avoided. "Owning" package agreement
  by convention, not by the compiler, is not agreement.

## Consequences
- The architect is the sole owner of these constants, same as every other
  contract value.
- A change to a shared constant is a breaking change across every consumer,
  exactly like a type change — treat it with the same weight.
