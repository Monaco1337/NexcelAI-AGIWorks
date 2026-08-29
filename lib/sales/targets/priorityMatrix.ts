/**
 * Sales-Priority-Matrix.
 *
 * Reine numerische Scores können Artefakte produzieren: eine Firma mit
 * Score 82 kann trotzdem operativ nicht sinnvoll bearbeitet werden, wenn
 * sie z. B. keine erreichbaren Kontakte hat. Wir setzen deshalb einen
 * expliziten qualitativen Guard obendrauf.
 *
 * Ergebnis ist eine Matrix-Priorität in
 *   A+ | A | B | B_RESEARCH | C | RESEARCH
 * mit einer Begründung. Wenn Score und Matrix-Priorität abweichen, gilt:
 *  - „RESEARCH" überschreibt hohe Scores (Datenlücke)
 *  - Kombinierte Matrix wird zusätzlich in `sales_target_lead_scores.matrix_priority`
 *    gespeichert, ohne den numerischen Score zu manipulieren.
 */

export type NeedLevel = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
export type CapacityLevel = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
export type ContactabilityLevel = "HIGH" | "MEDIUM" | "LOW" | "NONE";

export type MatrixPriority = "A+" | "A" | "B" | "B_RESEARCH" | "C" | "D" | "RESEARCH";

export interface PriorityMatrixInput {
  need: NeedLevel;
  capacity: CapacityLevel;
  contactability: ContactabilityLevel;
  evidenceConfidence: number; // 0..1
  numericScore?: number | null;
}

export interface PriorityMatrixResult {
  priority: MatrixPriority;
  reason: string;
  numericAgreement: "agree" | "score_higher" | "score_lower" | "unknown";
}

export function needLevelFromScore(score: number | null | undefined): NeedLevel {
  if (score === null || score === undefined) return "UNKNOWN";
  if (score >= 70) return "HIGH";
  if (score >= 45) return "MEDIUM";
  return "LOW";
}

export function capacityLevelFromClass(cls: string | null | undefined): CapacityLevel {
  switch (cls) {
    case "VERY_HIGH":
    case "HIGH":
      return "HIGH";
    case "MEDIUM":
      return "MEDIUM";
    case "LOW":
    case "VERY_LOW":
      return "LOW";
    default:
      return "UNKNOWN";
  }
}

export function contactabilityLevelFromScore(score: number | null | undefined): ContactabilityLevel {
  if (score === null || score === undefined) return "NONE";
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  if (score > 0) return "LOW";
  return "NONE";
}

export function evaluatePriorityMatrix(input: PriorityMatrixInput): PriorityMatrixResult {
  const { need, capacity, contactability, evidenceConfidence, numericScore } = input;

  // Fall 1: Bedarf UNKNOWN → immer Research
  if (need === "UNKNOWN") {
    return {
      priority: "RESEARCH",
      reason: "Bedarf noch nicht belegt — Research vor Vertriebs-Kontakt",
      numericAgreement: agreement(numericScore, "RESEARCH"),
    };
  }

  // Fall 2: sehr niedriges Evidence-Level → immer Research, unabhängig vom Score
  if (evidenceConfidence < 0.35) {
    return {
      priority: "RESEARCH",
      reason: `Zu geringe Evidenz (${Math.round(evidenceConfidence * 100)} %) für autoritative Priorität`,
      numericAgreement: agreement(numericScore, "RESEARCH"),
    };
  }

  // Fall 3: HIGH NEED + HIGH CAPACITY
  if (need === "HIGH" && capacity === "HIGH") {
    if (contactability === "HIGH") {
      return {
        priority: "A+",
        reason: "Hoher Bedarf, hohe Kapazität, direkt erreichbar",
        numericAgreement: agreement(numericScore, "A+"),
      };
    }
    if (contactability === "MEDIUM") {
      return {
        priority: "A",
        reason: "Hoher Bedarf & Kapazität, Kontakt möglich (nicht ideal)",
        numericAgreement: agreement(numericScore, "A"),
      };
    }
    // Low/None Contactability
    return {
      priority: "A",
      reason: "Starker Fit, aber Kontaktweg unklar — Entscheider gezielt suchen",
      numericAgreement: agreement(numericScore, "A"),
    };
  }

  // Fall 4: HIGH NEED + UNKNOWN CAPACITY
  if (need === "HIGH" && capacity === "UNKNOWN") {
    return {
      priority: "B_RESEARCH",
      reason: "Bedarf klar, Kapazität noch unklar — vor Angebot verifizieren",
      numericAgreement: agreement(numericScore, "B_RESEARCH"),
    };
  }

  // Fall 5: HIGH NEED + MEDIUM CAPACITY
  if (need === "HIGH" && capacity === "MEDIUM") {
    return {
      priority: contactability === "HIGH" ? "A" : "B",
      reason: "Bedarf klar, Kapazität mittel",
      numericAgreement: agreement(numericScore, contactability === "HIGH" ? "A" : "B"),
    };
  }

  // Fall 6: HIGH NEED + LOW CAPACITY
  if (need === "HIGH" && capacity === "LOW") {
    return {
      priority: "C",
      reason: "Bedarf klar, aber Budget/Kapazität begrenzt — Low-Ticket-Einstieg prüfen",
      numericAgreement: agreement(numericScore, "C"),
    };
  }

  // Fall 7: MEDIUM NEED
  if (need === "MEDIUM") {
    if (capacity === "HIGH" && contactability === "HIGH") {
      return {
        priority: "B",
        reason: "Mittlerer Bedarf mit klarem Kontakt-Weg",
        numericAgreement: agreement(numericScore, "B"),
      };
    }
    return {
      priority: "C",
      reason: "Mittlerer Bedarf, kein starker Trigger für Priorität",
      numericAgreement: agreement(numericScore, "C"),
    };
  }

  // Fall 8: LOW NEED
  if (need === "LOW") {
    if (capacity === "HIGH") {
      return {
        priority: "C",
        reason: "Kein akuter Bedarf, aber Kapazität für spätere Ansprache",
        numericAgreement: agreement(numericScore, "C"),
      };
    }
    return {
      priority: "D",
      reason: "Kein akuter Bedarf und keine erkennbare Kapazität",
      numericAgreement: agreement(numericScore, "D"),
    };
  }

  return {
    priority: "D",
    reason: "Kein passendes Matrix-Muster",
    numericAgreement: agreement(numericScore, "D"),
  };
}

function agreement(numericScore: number | null | undefined, matrix: MatrixPriority): PriorityMatrixResult["numericAgreement"] {
  if (numericScore === null || numericScore === undefined) return "unknown";
  const expected = expectedRangeForMatrix(matrix);
  if (!expected) return "unknown";
  if (numericScore >= expected.min && numericScore <= expected.max) return "agree";
  return numericScore > expected.max ? "score_higher" : "score_lower";
}

function expectedRangeForMatrix(m: MatrixPriority): { min: number; max: number } | null {
  switch (m) {
    case "A+":
      return { min: 82, max: 100 };
    case "A":
      return { min: 68, max: 88 };
    case "B":
      return { min: 55, max: 74 };
    case "B_RESEARCH":
      return { min: 45, max: 74 };
    case "C":
      return { min: 35, max: 60 };
    case "D":
      return { min: 0, max: 45 };
    case "RESEARCH":
      return { min: 0, max: 100 };
    default:
      return null;
  }
}
