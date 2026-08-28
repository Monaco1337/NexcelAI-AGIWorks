/**
 * Guided-Next-Step-Engine.
 *
 * Prüft, dass jede Vertriebsphase deterministisch genau eine
 * eindeutige Empfehlung liefert und dass End-Zustände sowie die
 * kritischen Übergänge (Solution-Readiness, Angebot versendet,
 * Follow-up offen, gewonnen/verloren) korrekt Vorrang bekommen.
 */

import { recommendNextStep, type NextStepInputState } from "../../lib/sales/nextStep";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function base(partial: Partial<NextStepInputState> = {}): NextStepInputState {
  return {
    hasOpportunity: true,
    status: "neu",
    hasPreCall: false,
    callsCount: 0,
    hasContact: false,
    ...partial,
  };
}

async function main(): Promise<void> {
  // Keine Opportunity → Anlegen.
  const noOpp = recommendNextStep(base({ hasOpportunity: false }));
  assert(noOpp.kind === "OPEN_OPPORTUNITY", "Ohne Opportunity muss Anlegen empfohlen werden");

  // Frisch mit Kontakt aber ohne Pre-Call → Pre-Call vorbereiten.
  const precall = recommendNextStep(base({ hasContact: true }));
  assert(precall.kind === "PREPARE_PRECALL", "Mit Kontakt + ohne Pre-Call: Pre-Call vorbereiten");

  // Kontakt + Pre-Call vorhanden → Erstkontakt.
  const call = recommendNextStep(base({ hasContact: true, hasPreCall: true }));
  assert(call.kind === "MAKE_FIRST_CALL", "Mit Pre-Call: Erstkontakt empfehlen");
  assert(call.focus === "call", "Erstkontakt muss Focus 'call' setzen");

  // Nach Kontaktversuch mit einem Call → Post-Call-Analyse.
  const post = recommendNextStep(
    base({ hasContact: true, hasPreCall: true, callsCount: 1, status: "kontaktversuch" })
  );
  assert(post.kind === "POST_CALL_ANALYSIS", "Erster Call → Post-Call-Analyse");

  // Interesse geweckt → Termin vereinbaren.
  const meeting = recommendNextStep(base({ hasContact: true, status: "interesse" }));
  assert(meeting.kind === "SCHEDULE_MEETING", "Interesse → Termin vereinbaren");

  // Termin steht → Discovery vorbereiten.
  const prep = recommendNextStep(base({ hasContact: true, status: "termin_vereinbart" }));
  assert(prep.kind === "PREPARE_DISCOVERY", "Termin steht → Discovery vorbereiten");
  assert(prep.focus === "discovery", "Discovery muss Focus 'discovery' setzen");

  // Discovery mit kritischen Lücken → Bedarf vervollständigen.
  const disc = recommendNextStep(
    base({
      hasContact: true,
      status: "bedarfsgespraech_abgeschlossen",
      discovery: {
        clarified: ["A_ziel"],
        partial: [],
        open: ["E_pain", "L_zielzustand"],
        criticalOpen: ["E_pain", "L_zielzustand"],
        ratio: 0.1,
        readyForSolution: false,
      },
    })
  );
  assert(disc.kind === "COMPLETE_DISCOVERY", "Kritische Lücken → Bedarf vervollständigen");

  // Discovery bereit → Lösung ausarbeiten.
  const draft = recommendNextStep(
    base({
      hasContact: true,
      status: "bedarfsgespraech_abgeschlossen",
      discovery: {
        clarified: [
          "A_ziel",
          "E_pain",
          "F_ursache",
          "G_auswirkung",
          "L_zielzustand",
          "T_budget",
        ],
        partial: [],
        open: [],
        criticalOpen: [],
        ratio: 0.6,
        readyForSolution: true,
      },
    })
  );
  assert(draft.kind === "DRAFT_SOLUTION", "Discovery bereit → Lösung ausarbeiten");

  // Solution vorhanden, nicht freigegeben → Freigeben.
  const approveSol = recommendNextStep(
    base({ hasContact: true, solution: { exists: true, approved: false } })
  );
  assert(approveSol.kind === "APPROVE_SOLUTION", "Solution im Entwurf → Freigeben");

  // Solution freigegeben, kein Proposal → Proposal vorbereiten.
  const prepProp = recommendNextStep(
    base({ hasContact: true, solution: { exists: true, approved: true } })
  );
  assert(prepProp.kind === "PREPARE_PROPOSAL", "Freigegebene Solution ohne Angebot → Vorbereiten");

  // Proposal existiert ohne Version → Version erzeugen.
  const genProp = recommendNextStep(
    base({
      hasContact: true,
      solution: { exists: true, approved: true },
      proposal: {
        exists: true,
        hasVersion: false,
        versionApproved: false,
        sent: false,
        followupOpen: false,
        accepted: false,
        rejected: false,
      },
    })
  );
  assert(genProp.kind === "GENERATE_PROPOSAL", "Angebot ohne Version → Version erzeugen");

  // Proposal mit unfreigegebener Version → Review.
  const reviewProp = recommendNextStep(
    base({
      hasContact: true,
      solution: { exists: true, approved: true },
      proposal: {
        exists: true,
        hasVersion: true,
        versionApproved: false,
        sent: false,
        followupOpen: false,
        accepted: false,
        rejected: false,
      },
    })
  );
  assert(reviewProp.kind === "REVIEW_PROPOSAL", "Angebotsversion offen → Prüfen");

  // Version freigegeben, nicht versendet → Versenden.
  const sendProp = recommendNextStep(
    base({
      hasContact: true,
      solution: { exists: true, approved: true },
      proposal: {
        exists: true,
        hasVersion: true,
        versionApproved: true,
        sent: false,
        followupOpen: false,
        accepted: false,
        rejected: false,
      },
    })
  );
  assert(sendProp.kind === "SEND_PROPOSAL", "Freigegebene Version → Versenden");

  // Versendet + Follow-up offen → Follow-up erledigen.
  const followup = recommendNextStep(
    base({
      hasContact: true,
      solution: { exists: true, approved: true },
      proposal: {
        exists: true,
        hasVersion: true,
        versionApproved: true,
        sent: true,
        followupOpen: true,
        accepted: false,
        rejected: false,
      },
    })
  );
  assert(followup.kind === "FOLLOWUP_PROPOSAL", "Versendet + Follow-up → Follow-up");

  // End-Zustände.
  const won = recommendNextStep(base({ status: "gewonnen" }));
  assert(won.kind === "DEAL_WON", "Gewonnen: Deal-Won-Empfehlung");
  const lost = recommendNextStep(base({ status: "verloren" }));
  assert(lost.kind === "DEAL_LOST", "Verloren: Deal-Lost-Empfehlung");
  const def = recommendNextStep(base({ status: "zurueckgestellt" }));
  assert(def.kind === "DEAL_DEFERRED", "Zurückgestellt: Wiedervorlage");

  // Angebot angenommen — trotz Follow-up offen → Deal schließen.
  const accepted = recommendNextStep(
    base({
      hasContact: true,
      solution: { exists: true, approved: true },
      proposal: {
        exists: true,
        hasVersion: true,
        versionApproved: true,
        sent: true,
        followupOpen: true,
        accepted: true,
        rejected: false,
      },
    })
  );
  assert(accepted.kind === "DEAL_WON", "Angebot angenommen → Deal schließen");

  console.log("OK  tests/sales/nextStep.test.ts");
}

void main().catch((err) => {
  console.error("FAIL tests/sales/nextStep.test.ts");
  console.error(err);
  process.exit(1);
});
