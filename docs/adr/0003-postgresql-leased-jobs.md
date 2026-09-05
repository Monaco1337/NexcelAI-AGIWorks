# ADR-0003: PostgreSQL leased jobs

Status: Accepted

## Context

Serverless processes may terminate at any point. In-memory ownership and
session-scoped locks are not durable, while effects must remain idempotent under
at-least-once execution.

## Decision

Keep separate search and enrichment job types in PostgreSQL, sharing lease
semantics: `FOR UPDATE SKIP LOCKED` claim, unguessable worker token, expiry,
heartbeat, bounded retry with jitter, reclaim and token-owned completion.

## Consequences

The database receives polling/claim load and needs queue indexes plus age
monitoring. Jobs survive worker death, stale workers cannot commit after lease
loss, and processors can later move behind another queue without changing their
contracts.
