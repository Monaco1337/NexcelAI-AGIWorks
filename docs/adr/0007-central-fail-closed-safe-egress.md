# ADR-0007: Central fail-closed safe egress

Status: Accepted

## Context

Discovered website URLs are untrusted. Scheme/hostname checks alone do not
close DNS rebinding, redirect, decompression, content-type and parser resource
risks.

## Decision

All target website traffic passes one Node-only safe HTTP boundary. It validates
every address and redirect, binds the connection to an approved address while
preserving host/SNI, and enforces time, redirect, header, compressed and
decompressed byte, MIME and parser limits. Uncertain policy fails closed.

## Consequences

Some CDN configurations may be rejected and the client requires focused
security testing. Website enrichment can be disabled independently while
discovery continues; callers never bypass the policy after a failed validation.
