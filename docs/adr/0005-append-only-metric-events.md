# ADR-0005: Append-only metric events

Status: Accepted

## Context

Inserted companies, ready statuses, scores and qualified net-new leads are
different events. Live table aggregates cannot reliably preserve first-passage
semantics or rebuild historical funnels.

## Decision

Record idempotent append-only pipeline milestone events and build versioned
hourly PostgreSQL rollups. `RAW_DISCOVERED`, `CANDIDATE_VALIDATED`,
`CANONICAL_CREATED`, `QUALIFIED_NEW` and `SALES_READY` remain distinct.

## Consequences

Aggregation becomes an explicit job and late events require rollup repair.
Metrics gain stable numerators, denominators and definitions; rollups can be
rebuilt and the event stream can later feed a warehouse without changing core
semantics.
