# ADR-0008: Browser-independent scheduler lanes

Status: Accepted

## Context

Browser-triggered processing stops when an operator closes the page and can
amplify work through refreshes. A perpetual worker does not fit the verified
serverless deployment.

## Decision

Use authenticated, bounded scheduler, discovery, enrichment, rollup, refresh
and reconciliation lanes. Each invocation claims only work that fits explicit
count/time/bytes/cost limits and stops before the platform deadline.

## Consequences

Cron frequency and deployment-plan capacity require runtime validation.
Progress no longer depends on the Admin UI, missed invocations are detectable
through heartbeats and another scheduler can call the same authenticated
boundaries later.
