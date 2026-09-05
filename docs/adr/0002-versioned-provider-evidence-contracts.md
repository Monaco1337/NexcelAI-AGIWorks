# ADR-0002: Versioned provider evidence contracts

Status: Accepted

## Context

Provider-shaped objects currently flow toward canonical rows through more than
one ingestion path. TypeScript types do not validate untrusted runtime data and
direct mutation prevents exact replay, rejection accounting and contract
evolution.

## Decision

Every adapter emits a bounded, runtime-validated, versioned raw observation.
Normalization emits a separate candidate contract. Observations are evidence,
never canonical companies. Retention/license policy and idempotency metadata are
part of the boundary.

## Consequences

Adapters gain schema ceremony and invalid payloads can be quarantined. In
return, canonical mutation is auditable, providers are replaceable and old
observations can be replayed through newer deterministic normalization rules.
