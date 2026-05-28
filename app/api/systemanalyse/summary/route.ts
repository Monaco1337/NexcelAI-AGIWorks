import { NextRequest, NextResponse } from "next/server";
import { buildHeuristicSummary } from "@/lib/systemanalyse/summary-heuristic";
import { normalizeAnalysisSummary, parseJsonFromModelContent } from "@/lib/systemanalyse/summary-normalize";
import type { AnalysisSummary } from "@/lib/systemanalyse/summary-types";
import type { SystemanalyseState } from "@/lib/systemanalyse/types";

type Body = {
  brandId?: string;
  brandName?: string;
  payload?: Partial<SystemanalyseState> & Record<string, unknown>;
};

function pickState(p: Body["payload"]): Parameters<typeof buildHeuristicSummary>[0] {
  const defaults: Parameters<typeof buildHeuristicSummary>[0] = {
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
  };
  if (!p || typeof p !== "object") return defaults;
  return { ...defaults, ...p } as typeof defaults;
}

async function tryOpenAiSummary(
  brandName: string,
  payload: Record<string, unknown>,
  heuristic: AnalysisSummary
): Promise<AnalysisSummary | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const sys = `Du bist Senior-Softwarearchitekt und Berater (DACH). Du erstellst eine präzise, verständliche Auswertung auf Deutsch.
Regeln:
- Nutze NUR Informationen aus den Rohdaten; nichts erfinden.
- Keine Marketing-Floskeln. Kurz, klar, Premium-Ton.
- Vorschläge müssen realistisch als Individualsoftware, Integrationen, Automatisierung und Portale umsetzbar sein (keine Fantasie-Produkte).
Antworte NUR mit gültigem JSON (kein Markdown), Schema exakt:
{
  "situation": "string — Kurz-Zusammenfassung Unternehmenssituation",
  "problems": "string — Hauptprobleme / Engpässe, ggf. mit Zeilenumbruch und •",
  "potential": "string — Automatisierungs-Potenzial, Zeit & Kosten",
  "recommendation": "string — 1–3 Sätze Einleitung zur System-Empfehlung",
  "systemProposalBullets": ["string", "…"],
  "nextSteps": "string — Nächste Schritte für den Kunden",
  "score": number,
  "potentialLevel": "string kurz",
  "scoreHint": "string kurz"
}
score: ganze Zahl 18–94 (geschätzter System-Reifegrad aus Datenlage).
systemProposalBullets: 5–8 kurze Sätze, jeweils ein umsetzbarer Baustein (z.B. zentraler Datenkern, Workflows, CRM, Dokumentenlogik, APIs).`;

  const user = `Marke / Kontext: ${brandName}
Rohdaten (JSON, gekürzt auf 14k Zeichen): ${JSON.stringify(payload).slice(0, 14000)}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;
    let parsed: unknown;
    try {
      parsed = parseJsonFromModelContent(raw);
    } catch {
      return null;
    }
    return normalizeAnalysisSummary(parsed, heuristic);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.payload || typeof body.payload !== "object") {
      return NextResponse.json({ error: "Ungültige Nutzdaten." }, { status: 400 });
    }
    const brandName = typeof body.brandName === "string" ? body.brandName : "Ihr Unternehmen";
    const stateSlice = pickState(body.payload);
    const heuristic = buildHeuristicSummary(stateSlice, brandName);

    const ai = await tryOpenAiSummary(brandName, body.payload as Record<string, unknown>, heuristic);
    const summary = ai ?? heuristic;

    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ error: "Auswertung fehlgeschlagen." }, { status: 500 });
  }
}
