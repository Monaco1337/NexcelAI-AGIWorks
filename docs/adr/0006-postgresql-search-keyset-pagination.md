# ADR-0006: PostgreSQL search and keyset pagination

Status: Accepted

## Context

The existing generated PostgreSQL search vector is useful, but offset
pagination and aggregation-heavy list reads degrade at deeper pages. There is
no measured requirement for Elasticsearch.

## Decision

Keep PostgreSQL full-text and exact indexes, introduce a rebuildable current
summary projection, and move stable sort tuples to validated opaque keyset
cursors with an ID tie-breaker. Retain bounded offset compatibility during
migration.

## Consequences

Arbitrary page jumps are not a primary capability and projection freshness must
be observable. Deep-page cost becomes predictable and the API contract leaves
room for a future search backend if benchmarks later require one.
