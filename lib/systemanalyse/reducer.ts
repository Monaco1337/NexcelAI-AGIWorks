import {
  composeContextNarrative,
  driversFromContextChoices,
} from "./conversation-context";
import { STEP_ORDER, type SystemanalyseAction, type SystemanalyseState } from "./types";

export const initialSystemanalyseState: SystemanalyseState = {
  stepIndex: 0,
  companyName: "",
  contactName: "",
  role: "",
  email: "",
  phone: "",
  companySize: "",
  teamSize: "",
  industry: "",
  industryOther: "",
  region: "",
  digitalMaturity: "",
  situationNarrative: "",
  situationDrivers: [],
  contextConvoIndex: 0,
  contextConvoChoices: {},
  industryFollowUp: {},
  painByBlock: {},
  painConcrete: "",
  painCost: "",
  toolsUsed: [],
  toolsOther: "",
  toolsWorkingWell: "",
  toolsFriction: "",
  goals: [],
  goalIdealSixMonths: "",
  goalShortTermMust: "",
  urgency: "",
  bottleneck: "",
  businessRelevance: "",
  mustNotContinue: "",
  projectDirections: [],
  budgetRange: "",
  projectPhase: "",
  timeHorizon: "",
  contactPreference: "",
  appointmentPreference: "",
  consentDsgvo: false,
  submitStatus: "idle",
  submitError: "",
};

function toggleInArray(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

export function systemanalyseReducer(
  state: SystemanalyseState,
  action: SystemanalyseAction
): SystemanalyseState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, stepIndex: Math.max(0, Math.min(action.index, STEP_ORDER.length - 1)) };
    case "NEXT":
      return {
        ...state,
        stepIndex: Math.min(state.stepIndex + 1, STEP_ORDER.length - 1),
      };
    case "PREV":
      return { ...state, stepIndex: Math.max(0, state.stepIndex - 1) };
    case "PATCH":
      return { ...state, ...action.patch };
    case "TOGGLE_SITUATION":
      return {
        ...state,
        situationDrivers: toggleInArray(state.situationDrivers, action.id),
      };
    case "TOGGLE_INDUSTRY_FOLLOWUP": {
      const cur = state.industryFollowUp[action.questionId] ?? [];
      return {
        ...state,
        industryFollowUp: {
          ...state.industryFollowUp,
          [action.questionId]: toggleInArray(cur, action.optionId),
        },
      };
    }
    case "TOGGLE_PAIN": {
      const cur = state.painByBlock[action.blockId] ?? [];
      return {
        ...state,
        painByBlock: {
          ...state.painByBlock,
          [action.blockId]: toggleInArray(cur, action.itemId),
        },
      };
    }
    case "TOGGLE_TOOL":
      return { ...state, toolsUsed: toggleInArray(state.toolsUsed, action.id) };
    case "TOGGLE_GOAL":
      return { ...state, goals: toggleInArray(state.goals, action.id) };
    case "TOGGLE_PROJECT_DIRECTION":
      return {
        ...state,
        projectDirections: toggleInArray(state.projectDirections, action.id),
      };
    case "SET_SUBMIT_STATUS":
      return {
        ...state,
        submitStatus: action.status,
        submitError: action.error ?? "",
      };
    case "CONTEXT_CONVO_SELECT": {
      if (action.questionIndex !== state.contextConvoIndex || state.contextConvoIndex > 3) {
        return state;
      }
      const key = `q${action.questionIndex + 1}` as "q1" | "q2" | "q3" | "q4";
      const newChoices = { ...state.contextConvoChoices, [key]: action.optionId };
      const newIdx = state.contextConvoIndex + 1;
      const drivers = driversFromContextChoices(newChoices);
      const narrative =
        newIdx === 4 ? composeContextNarrative(newChoices) : state.situationNarrative;
      return {
        ...state,
        contextConvoChoices: newChoices,
        contextConvoIndex: newIdx,
        situationDrivers: drivers,
        situationNarrative: narrative,
      };
    }
    case "CONTEXT_CONVO_BACK": {
      if (state.contextConvoIndex <= 0) return state;
      if (state.contextConvoIndex === 4) {
        const { q4: _q4, ...rest } = state.contextConvoChoices;
        return {
          ...state,
          contextConvoIndex: 3,
          contextConvoChoices: rest,
          situationDrivers: driversFromContextChoices(rest),
          situationNarrative: composeContextNarrative(rest) || "",
        };
      }
      const cur = state.contextConvoIndex;
      const removeKey = `q${cur}` as "q1" | "q2" | "q3" | "q4";
      const { [removeKey]: _removed, ...restChoices } = state.contextConvoChoices;
      return {
        ...state,
        contextConvoIndex: cur - 1,
        contextConvoChoices: restChoices,
        situationDrivers: driversFromContextChoices(restChoices),
        situationNarrative: composeContextNarrative(restChoices) || "",
      };
    }
    default:
      return state;
  }
}
