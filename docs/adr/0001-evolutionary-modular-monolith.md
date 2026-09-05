# ADR-0001: Evolutionary modular monolith

Status: Accepted

## Context

The application, PostgreSQL schema, Admin UI, provider adapters and target
pipeline already run as one Next.js deployment. The measured limits that would
justify microservices, an external queue or a search cluster are not available.

## Decision

Evolve the existing modular monolith. PostgreSQL remains the transactional
source of truth and orchestration backend; bounded stateless workers run in the
existing deployment. Internal boundaries use versioned contracts so a transport
can be replaced later.

## Consequences

This minimizes migration and operational risk, but requires disciplined module
boundaries and careful database load control. New infrastructure is introduced
only after runtime measurements identify a concrete bottleneck.
