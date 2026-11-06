"use client";
import { usePathname } from "next/navigation";

/**
 * Hub / overview template. Indexable entry point that links to a collection of
 * detail pages (money / location / knowledge) so none of them are orphaned.
 * Renders on the shared TemplateFrame + a CollectionPage JSON-LD.
 */

import Link from "@/components/BrandAwareLink";
import TemplateFrame from "./TemplateFrame";
import { TemplateSection, GlassCard, CardGrid } from "./primitives";
import type { BrandKey } from "@/config/seo/domains";
import type { TemplateBase } from "@/lib/templates/types";

export interface HubItem {
  href: string;
  title: string;
  description?: string;
}

export interface HubTemplateProps {
  brand: BrandKey;
  canonicalUrl: string;
  eyebrow?: string;
  breadcrumbLabel: string;
  title: string;
  intro: string;
  /** Section heading above the item grid. */
  itemsHeading: string;
  items: HubItem[];
}

/* SEO_COMMERCIAL_CLUSTERS_V2 */
type SeoCluster = { heading: string; summary: string; links: { href: string; label: string }[] };
const SEO_CLUSTERS: Record<BrandKey, SeoCluster[]> = {
  "nexcel": [
    {
      "heading": "KI-Systeme und Agenten",
      "summary": "Aufgaben klassifizieren, Entscheidungen vorbereiten und freigegebene Abläufe unterstützen.",
      "links": [
        {
          "href": "/loesungen/ki-systeme",
          "label": "KI-Systeme für Unternehmen"
        },
        {
          "href": "/loesungen/ki-agenten",
          "label": "KI-Agenten entwickeln lassen"
        },
        {
          "href": "/wissen/was-ist-ein-ki-agent",
          "label": "Was ist ein KI-Agent?"
        }
      ]
    },
    {
      "heading": "Prozesse und Vertrieb",
      "summary": "Lead-Bearbeitung, Systemübergaben und wiederkehrende Prozessschritte systematisch automatisieren.",
      "links": [
        {
          "href": "/loesungen/automatisierung",
          "label": "Prozessautomatisierung"
        },
        {
          "href": "/loesungen/lead-automation",
          "label": "Lead-Automatisierung"
        },
        {
          "href": "/loesungen/crm-automation",
          "label": "CRM-Automatisierung"
        }
      ]
    },
    {
      "heading": "Kundenkommunikation",
      "summary": "Serviceprozesse und Kontaktpunkte vom Eingang einer Anfrage bis zur Nachbearbeitung verbessern.",
      "links": [
        {
          "href": "/loesungen/customer-experience-systeme",
          "label": "Customer-Experience-Systeme"
        },
        {
          "href": "/loesungen/email-automation",
          "label": "E-Mail-Automatisierung"
        },
        {
          "href": "/wissen/customer-experience-mit-ki-verbessern",
          "label": "Customer Experience mit KI"
        }
      ]
    },
    {
      "heading": "Eigene LLMs und Unternehmenswissen",
      "summary": "Modellanpassung, Wissensanbindung und Betrieb anhand tatsächlicher Anforderungen beurteilen.",
      "links": [
        {
          "href": "/loesungen/eigene-llms",
          "label": "Eigene LLMs entwickeln lassen"
        },
        {
          "href": "/wissen/was-ist-ki-automatisierung",
          "label": "KI-Automatisierung verstehen"
        },
        {
          "href": "/systemanalyse",
          "label": "Systemanalyse starten"
        }
      ]
    }
  ],
  "agiworks": [
    {
      "heading": "Softwarearchitektur und Schnittstellen",
      "summary": "Wartbare Anwendungen mit klaren APIs, Datenmodellen und Integrationsgrenzen entwickeln.",
      "links": [
        {
          "href": "/leistungen/softwareentwicklung",
          "label": "Individualsoftware entwickeln lassen"
        },
        {
          "href": "/leistungen/api-entwicklung",
          "label": "API- und Schnittstellenentwicklung"
        },
        {
          "href": "/wissen/individualsoftware-vs-standardsoftware",
          "label": "Individual- oder Standardsoftware?"
        }
      ]
    },
    {
      "heading": "ERP und CRM",
      "summary": "Unternehmensprozesse, Rollen und Datenflüsse als integrierte Systeme abbilden.",
      "links": [
        {
          "href": "/leistungen/erp-system-entwicklung",
          "label": "ERP-System entwickeln lassen"
        },
        {
          "href": "/leistungen/crm-system-entwicklung",
          "label": "CRM-System entwickeln lassen"
        },
        {
          "href": "/wissen/erp-system-einfuehren",
          "label": "ERP-System einführen"
        }
      ]
    },
    {
      "heading": "Web-Apps, SaaS und Portale",
      "summary": "Webanwendungen mit belastbarer Geschäftslogik, Zugriffsschutz und planbarem Betrieb entwickeln.",
      "links": [
        {
          "href": "/leistungen/web-app-entwicklung",
          "label": "Web-App-Entwicklung"
        },
        {
          "href": "/leistungen/saas-entwicklung",
          "label": "SaaS-Entwicklung"
        },
        {
          "href": "/leistungen/kundenportal-entwicklung",
          "label": "Kundenportal entwickeln"
        }
      ]
    },
    {
      "heading": "LLM-Engineering und RAG",
      "summary": "Sprachmodelle an bestehende Systeme anbinden, nachvollziehbar evaluieren und sicher betreiben.",
      "links": [
        {
          "href": "/leistungen/eigene-llms",
          "label": "LLM-Entwicklung und Integration"
        },
        {
          "href": "/leistungen/api-entwicklung",
          "label": "Modellschnittstellen integrieren"
        },
        {
          "href": "/systemanalyse",
          "label": "Technische Systemanalyse"
        }
      ]
    }
  ]
};

export default function HubTemplate(props: HubTemplateProps) {
  const pathname = usePathname() || "";
  const isLocalAgi = props.brand === "agiworks" && (pathname === "/agiworks" || pathname.startsWith("/agiworks/"));
  const base: TemplateBase = {
    brand: props.brand,
    canonicalUrl: props.canonicalUrl,
    breadcrumbs: [
      { label: "Start", href: "/" },
      { label: props.breadcrumbLabel, href: props.canonicalUrl },
    ],
    eyebrow: props.eyebrow,
    title: props.title,
    intro: props.intro,
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: props.title,
    description: props.intro,
    url: props.canonicalUrl,
    hasPart: props.items.map((i) => ({ "@type": "WebPage", name: i.title })),
  };

  return (
    <TemplateFrame base={base} extraSchema={schema} showAuthor={false} cta={{ label: "Systemanalyse starten", href: "/systemanalyse" }}>
      <TemplateSection eyebrow={props.eyebrow} heading={props.itemsHeading}>
        <CardGrid>
          {props.items.map((item, i) => (
            <Link key={i} href={item.href} className="group block">
              <GlassCard>
                <h3 className="text-base font-medium text-white/95 group-hover:text-white">{item.title}</h3>
                {item.description && (
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{item.description}</p>
                )}
                <span className="mt-3 inline-block text-sm text-white/60 group-hover:text-white/85">Mehr erfahren →</span>
              </GlassCard>
            </Link>
          ))}
        </CardGrid>
      </TemplateSection>
      {/* SEO_COMMERCIAL_CLUSTERS_V2 */}
      {((props.brand === "nexcel" && props.canonicalUrl.endsWith("/loesungen")) ||
        (props.brand === "agiworks" && props.canonicalUrl.endsWith("/leistungen"))) && (
        <TemplateSection
          eyebrow="Themencluster"
          heading={props.brand === "nexcel" ? "KI-Lösungen nach Geschäftsaufgabe" : "Software nach Systemanforderung"}
          intro={props.brand === "nexcel"
            ? "Entscheidend sind der Prozess, der Datenzugriff und die erforderliche menschliche Kontrolle."
            : "Entscheidend sind Architektur, Integration und ein verlässlich betreibbares System."}
        >
          <CardGrid cols={2}>
            {SEO_CLUSTERS[props.brand].map((cluster) => (
              <GlassCard key={cluster.heading}>
                <h3 className="text-lg font-medium text-white">{cluster.heading}</h3>
                <p className="mt-3 text-sm leading-6 text-white/70">{cluster.summary}</p>
                <ul className="mt-5 space-y-3">
                  {cluster.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={isLocalAgi ? `/agiworks${link.href}` : link.href}
                        className="text-sm text-white/85 underline decoration-white/30 underline-offset-4 hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ))}
          </CardGrid>
        </TemplateSection>
      )}
    </TemplateFrame>
  );
}
