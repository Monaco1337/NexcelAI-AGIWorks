import { pickAuthoritative, type AuthorityCandidate } from "../sourceAuthority";

export interface FieldObservation<T = string> extends AuthorityCandidate<T> {
  observationId: string;
  observedAt: string;
  expiresAt?: string | null;
  manuallyLocked?: boolean;
}

export interface ProjectedField<T = string> {
  value: T | null;
  observationId: string | null;
  authority: number;
  conflicting: boolean;
  reason: string;
}

/**
 * Projects a preferred canonical value without destroying source evidence.
 * A manual lock wins; stale observations are excluded; close conflicts are
 * surfaced for review rather than resolved by arrival order.
 */
export function projectField<T>(
  observations: readonly FieldObservation<T>[],
  now = new Date(),
): ProjectedField<T> {
  const active = observations.filter(
    (item) => !item.expiresAt || Date.parse(item.expiresAt) > now.getTime(),
  );
  const manual = active.find((item) => item.manuallyLocked);
  if (manual) {
    return {
      value: manual.value,
      observationId: manual.observationId,
      authority: 1,
      conflicting: false,
      reason: "MANUAL_LOCK",
    };
  }

  const decision = pickAuthoritative([...active]);
  if (!decision) {
    return {
      value: null,
      observationId: null,
      authority: 0,
      conflicting: false,
      reason: "NO_ACTIVE_EVIDENCE",
    };
  }
  const chosen = active.find((item) => item === decision.chosen);
  return {
    value: decision.chosen.value,
    observationId: chosen?.observationId ?? null,
    authority: decision.chosenAuthority,
    conflicting: decision.conflicting,
    reason: decision.reason,
  };
}

