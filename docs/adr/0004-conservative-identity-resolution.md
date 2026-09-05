# ADR-0004: Conservative identity resolution

Status: Accepted

## Context

Company names, domains, phone numbers, branches and provider IDs can conflict.
Aggressive fuzzy auto-merge risks irreversible false merges; exact fingerprints
alone create false splits and race under concurrent workers.

## Decision

Use deterministic normalization and evidence-weighted outcomes. Auto-link only
on a stable provider ID or policy-approved strong/composite evidence. Fuzzy
name evidence routes to review. Database uniqueness and transaction-scoped
locks arbitrate races; resolution evidence and merge actions remain reversible.

## Consequences

The system tolerates temporary false splits in preference to destructive false
merges. Review/reconciliation work increases, but every decision is explainable
and future rules can revisit preserved evidence.
