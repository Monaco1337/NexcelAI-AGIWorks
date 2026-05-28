import { INDUSTRY_FOLLOWUPS } from "./config";
import type { StepKey } from "./types";
import { STEP_ORDER } from "./types";
import type { SystemanalyseState } from "./types";

export function getCurrentStepKey(state: SystemanalyseState): StepKey {
  return STEP_ORDER[state.stepIndex] ?? "intro";
}

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export function canProceed(state: SystemanalyseState, stepKey: StepKey): boolean {
  switch (stepKey) {
    case "intro":
      return true;
    case "profile":
      return (
        state.companyName.trim().length >= 2 &&
        state.contactName.trim().length >= 2 &&
        emailOk(state.email) &&
        state.companySize !== "" &&
        state.teamSize !== "" &&
        state.industry !== "" &&
        (state.industry !== "sonstige" || state.industryOther.trim().length >= 3) &&
        state.digitalMaturity !== ""
      );
    case "context":
      return (
        state.contextConvoIndex >= 4 &&
        state.situationNarrative.trim().length >= 40 &&
        state.situationDrivers.length >= 1
      );
    case "industry": {
      if (state.industry === "sonstige") return state.industryOther.trim().length >= 3;
      const followups = state.industry ? INDUSTRY_FOLLOWUPS[state.industry] : undefined;
      if (!followups?.length) return true;
      const count = followups.reduce(
        (n, q) => n + (state.industryFollowUp[q.id]?.length ?? 0),
        0
      );
      return count >= 1;
    }
    case "pain": {
      const totalPain = Object.values(state.painByBlock).reduce((n, a) => n + a.length, 0);
      const textOk =
        state.painConcrete.trim().length >= 20 || state.painCost.trim().length >= 20;
      return totalPain >= 3 || (totalPain >= 1 && textOk) || textOk;
    }
    case "tools":
      return true;
    case "goals":
      return (
        state.goals.length >= 1 &&
        state.goalIdealSixMonths.trim().length >= 20 &&
        state.goalShortTermMust.trim().length >= 15
      );
    case "priority":
      return (
        state.urgency !== "" &&
        state.bottleneck.trim().length >= 15 &&
        state.mustNotContinue.trim().length >= 15
      );
    case "project":
      return state.projectDirections.length >= 1;
    case "investment":
      return true;
    case "contact":
      return (
        state.contactName.trim().length >= 2 &&
        emailOk(state.email) &&
        state.companyName.trim().length >= 2 &&
        state.contactPreference !== "" &&
        state.consentDsgvo
      );
    case "complete":
      return false;
    default:
      return true;
  }
}
