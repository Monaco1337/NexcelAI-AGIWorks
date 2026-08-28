/**
 * Sieben Vertriebs-Workflows (öffentliche API des AI-Layers).
 *
 * Jeder Workflow ist ein dünner Adapter, der die passenden Variablen
 * für den jeweiligen Prompt zusammenstellt und `runWorkflow` aufruft.
 * Fachlogik lebt bewusst in den Prompts und in der nachgelagerten
 * menschlichen Freigabe — nicht im Code.
 */

import type { AuthContext } from "@/lib/auth/authorize";
import { getCompany } from "../companiesStore";
import { listContacts } from "../contactsStore";
import { getOpportunity } from "../opportunitiesStore";
import { listNotes } from "../notesStore";
import { getLatestSolution } from "../solutionsStore";
import { SalesError, type BrandContext } from "../model";
import { runWorkflow, type RunWorkflowResult } from "./executor";

/* -------------------------------------------------------------------------- */
/*  1. LEAD_RESEARCH                                                           */
/* -------------------------------------------------------------------------- */

export interface LeadResearchInput {
  region?: string;
  segments?: string[];
  known?: string[];
  additional?: string;
}

export async function runLeadResearch(
  auth: AuthContext,
  input: LeadResearchInput
): Promise<RunWorkflowResult> {
  return runWorkflow({
    promptKey: "LEAD_RESEARCH",
    entityType: "lead_query",
    entityId: null,
    vars: {
      region: input.region ?? "Unna, Kreis Unna, Dortmund, Kamen, Schwerte, Holzwickede, Fröndenberg, Lünen",
      segmente: (input.segments ?? ["Fitness & Gesundheit", "Beauty & Ästhetik", "Immobilien"]).join(", "),
      bekannt: (input.known ?? []).join(", ") || "keine",
      zusatz: input.additional ?? "",
    },
    untrustedVars: ["zusatz"],
    auth,
    activitySummary: "Deep Lead Research ausgeführt",
    activityKind: "ai_run_completed",
  });
}

/* -------------------------------------------------------------------------- */
/*  2. PRE_CALL                                                                */
/* -------------------------------------------------------------------------- */

export async function runPreCall(
  auth: AuthContext,
  companyId: string,
  observations?: string
): Promise<RunWorkflowResult> {
  const company = await getCompany(companyId);
  if (!company) throw new SalesError("Firma nicht gefunden", "not_found", 404);

  return runWorkflow({
    promptKey: "PRE_CALL",
    entityType: "company",
    entityId: companyId,
    companyId,
    vars: {
      unternehmen: company.name,
      website: company.website ?? "unbekannt",
      branche: company.industry ?? "unbekannt",
      ort: company.city ?? "unbekannt",
      beobachtungen: observations ?? "",
    },
    untrustedVars: ["beobachtungen"],
    auth,
    activitySummary: `Pre-Call-Intelligence für ${company.name}`,
    activityKind: "precall",
  });
}

/* -------------------------------------------------------------------------- */
/*  3. POST_CALL                                                               */
/* -------------------------------------------------------------------------- */

export interface PostCallInput {
  opportunityId: string;
  gespraechsNotizen: string;
  interesse?: string;
  probleme?: string;
  zusagen?: string;
  naechsterSchritt?: string;
  folgetermin?: string;
}

export async function runPostCall(
  auth: AuthContext,
  input: PostCallInput
): Promise<RunWorkflowResult> {
  const opp = await getOpportunity(input.opportunityId);
  if (!opp) throw new SalesError("Opportunity nicht gefunden", "not_found", 404);
  const company = await getCompany(opp.companyId);
  const contacts = await listContacts(opp.companyId);
  const primary = contacts.find((c) => c.isPrimary) ?? contacts[0];

  return runWorkflow({
    promptKey: "POST_CALL",
    brandContext: opp.brandContext,
    entityType: "opportunity",
    entityId: opp.id,
    companyId: opp.companyId,
    vars: {
      unternehmen: company?.name ?? "",
      website: company?.website ?? "",
      ort: company?.city ?? "",
      ansprechpartner: primary
        ? [primary.firstName, primary.lastName].filter(Boolean).join(" ")
        : "",
      position: primary?.position ?? "",
      gespraechsNotizen: input.gespraechsNotizen,
      interesse: input.interesse ?? "",
      probleme: input.probleme ?? "",
      zusagen: input.zusagen ?? "",
      naechsterSchritt: input.naechsterSchritt ?? "",
      folgetermin: input.folgetermin ?? "",
    },
    untrustedVars: ["gespraechsNotizen", "interesse", "probleme", "zusagen"],
    auth,
    activitySummary: `Post-Call-Tiefenanalyse für ${company?.name ?? "Opportunity"}`,
    activityKind: "postcall",
  });
}

/* -------------------------------------------------------------------------- */
/*  4. CLIENT_PREVIEW                                                          */
/* -------------------------------------------------------------------------- */

export async function runClientPreview(
  auth: AuthContext,
  opportunityId: string,
  postCallJson: unknown,
  folgetermin?: string
): Promise<RunWorkflowResult> {
  const opp = await getOpportunity(opportunityId);
  if (!opp) throw new SalesError("Opportunity nicht gefunden", "not_found", 404);
  const company = await getCompany(opp.companyId);
  const contacts = await listContacts(opp.companyId);
  const primary = contacts.find((c) => c.isPrimary) ?? contacts[0];

  return runWorkflow({
    promptKey: "CLIENT_PREVIEW",
    brandContext: opp.brandContext,
    entityType: "opportunity",
    entityId: opp.id,
    companyId: opp.companyId,
    vars: {
      unternehmen: company?.name ?? "",
      website: company?.website ?? "",
      ansprechpartner: primary
        ? [primary.firstName, primary.lastName].filter(Boolean).join(" ")
        : "",
      folgetermin: folgetermin ?? "",
      postCallAnalyse: postCallJson,
    },
    auth,
    activitySummary: `Kundenvorschau für ${company?.name ?? "Opportunity"}`,
    activityKind: "client_preview",
  });
}

/* -------------------------------------------------------------------------- */
/*  5. DISCOVERY_PREP                                                          */
/* -------------------------------------------------------------------------- */

export async function runDiscoveryPrep(
  auth: AuthContext,
  opportunityId: string
): Promise<RunWorkflowResult> {
  const opp = await getOpportunity(opportunityId);
  if (!opp) throw new SalesError("Opportunity nicht gefunden", "not_found", 404);
  const company = await getCompany(opp.companyId);

  // Neueste Post-Call- und Client-Preview-Notizen (falls vorhanden).
  const notes = await listNotes("opportunity", opp.id);
  const postCall = notes.find((n) => n.kind === "call")?.structured ?? {};
  const preview = notes.find((n) => n.kind === "discovery")?.structured ?? {};

  return runWorkflow({
    promptKey: "DISCOVERY_PREP",
    brandContext: opp.brandContext,
    entityType: "opportunity",
    entityId: opp.id,
    companyId: opp.companyId,
    vars: {
      unternehmen: company?.name ?? "",
      website: company?.website ?? "",
      postCall,
      clientPreview: preview,
    },
    auth,
    activitySummary: `Bedarfsgesprächs-Leitfaden für ${company?.name ?? "Opportunity"}`,
    activityKind: "discovery_prep",
  });
}

/* -------------------------------------------------------------------------- */
/*  6. SOLUTION_SCOPE                                                          */
/* -------------------------------------------------------------------------- */

export interface SolutionScopeInput {
  opportunityId: string;
  bestaetigteAnforderungen?: string;
  eigeneIdeen?: string;
}

export async function runSolutionScope(
  auth: AuthContext,
  input: SolutionScopeInput
): Promise<RunWorkflowResult> {
  const opp = await getOpportunity(input.opportunityId);
  if (!opp) throw new SalesError("Opportunity nicht gefunden", "not_found", 404);
  const company = await getCompany(opp.companyId);
  const notes = await listNotes("opportunity", opp.id);

  return runWorkflow({
    promptKey: "SOLUTION_SCOPE",
    brandContext: opp.brandContext,
    entityType: "opportunity",
    entityId: opp.id,
    companyId: opp.companyId,
    vars: {
      unternehmen: company?.name ?? "",
      website: company?.website ?? "",
      brandContext: opp.brandContext,
      preCall: notes.find((n) => n.kind === "call" && (n.structured as { source?: string }).source === "precall")?.structured ?? {},
      postCall: notes.find((n) => n.kind === "call")?.structured ?? {},
      clientPreview: notes.find((n) => n.kind === "discovery")?.structured ?? {},
      discoveryNotes: notes.find((n) => n.kind === "discovery")?.body ?? "",
      bestaetigteAnforderungen: input.bestaetigteAnforderungen ?? "",
      eigeneIdeen: input.eigeneIdeen ?? "",
    },
    untrustedVars: ["bestaetigteAnforderungen", "eigeneIdeen"],
    auth,
    activitySummary: `Lösungs- & Leistungsumfang für ${company?.name ?? "Opportunity"}`,
    activityKind: "solution_updated",
  });
}

/* -------------------------------------------------------------------------- */
/*  7. PROPOSAL                                                                */
/* -------------------------------------------------------------------------- */

export interface ProposalGenerateInput {
  opportunityId: string;
  brandContext?: BrandContext;
  projectName: string;
  approvedPrice: string;
  approvedRecurringCosts?: string;
  approvedOptionalItems?: string;
  approvedPaymentPlan?: string;
  approvedProjectTimeframe?: string;
  offerValidUntil?: string;
  customerResponsibilities?: string;
  additional?: string;
  brandAssets?: string;
  customerLogo?: string;
  customerBrandColors?: string;
  nexcelCompanyData?: string;
  agiWorksCompanyData?: string;
}

export async function runProposal(
  auth: AuthContext,
  input: ProposalGenerateInput
): Promise<RunWorkflowResult> {
  const opp = await getOpportunity(input.opportunityId);
  if (!opp) throw new SalesError("Opportunity nicht gefunden", "not_found", 404);
  const brand: BrandContext = input.brandContext ?? opp.brandContext;
  const company = await getCompany(opp.companyId);
  const contacts = await listContacts(opp.companyId);
  const primary = contacts.find((c) => c.isPrimary) ?? contacts[0];

  const solution = await getLatestSolution(opp.id);
  if (!solution?.approvedAt) {
    throw new SalesError(
      "Kein freigegebener Lösungs- & Leistungsumfang. Freigabe erforderlich.",
      "solution_not_approved",
      412
    );
  }

  const scope = solution.structured as Record<string, unknown>;

  return runWorkflow({
    promptKey: "PROPOSAL",
    brandContext: brand,
    entityType: "opportunity",
    entityId: opp.id,
    companyId: opp.companyId,
    vars: {
      company: company?.name ?? "",
      contact: primary
        ? [primary.firstName, primary.lastName].filter(Boolean).join(" ")
        : "",
      brandContext: brand,
      website: company?.website ?? "",
      projectName: input.projectName,
      approvedSolutionScope: scope,
      approvedBusinessValue: scope["businessValue"] ?? [],
      approvedDeliverables: (scope["definitionOfDone"] as Record<string, unknown>)?.["geliefert"] ?? [],
      approvedDefinitionOfDone: scope["definitionOfDone"] ?? {},
      approvedInScope: (scope["scope"] as Record<string, unknown>)?.["inScope"] ?? [],
      approvedOutOfScope: (scope["scope"] as Record<string, unknown>)?.["outOfScope"] ?? [],
      approvedPrice: input.approvedPrice,
      approvedRecurringCosts: input.approvedRecurringCosts ?? "",
      approvedOptionalItems: input.approvedOptionalItems ?? "",
      approvedPaymentPlan: input.approvedPaymentPlan ?? "",
      approvedProjectTimeframe: input.approvedProjectTimeframe ?? "",
      offerValidUntil: input.offerValidUntil ?? "",
      customerResponsibilities: input.customerResponsibilities ?? "",
      nexcelCompanyData:
        input.nexcelCompanyData ??
        "NEXCEL AI — Kevin Blazevic, Unna. Kontakt: kontakt@nexcel-ai.de.",
      agiWorksCompanyData:
        input.agiWorksCompanyData ??
        "AGI Works — Kevin Blazevic, Unna. Kontakt: kontakt@agi-works.de.",
      brandAssets: input.brandAssets ?? "",
      customerLogo: input.customerLogo ?? "",
      customerBrandColors: input.customerBrandColors ?? "",
      additional: input.additional ?? "",
    },
    untrustedVars: ["additional", "customerResponsibilities"],
    auth,
    activitySummary: `Angebot generiert für ${company?.name ?? "Opportunity"}`,
    activityKind: "proposal_version",
  });
}
