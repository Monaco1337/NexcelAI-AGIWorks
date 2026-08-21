import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { consumeShareToken } from "@/lib/billing/shareStore";
import {
  getInvoice,
  listInvoiceDocuments,
} from "@/lib/billing/invoicesStore";
import { formatEUR, formatDeDate } from "@/lib/billing/uiModel";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_COLOR } from "@/lib/billing/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Rechnung ansehen", robots: { index: false, follow: false } };

interface Params {
  params: Promise<{ token: string }>;
}

export default async function ShareInvoicePage({ params }: Params) {
  const { token } = await params;
  const share = await consumeShareToken(token);
  if (!share) notFound();

  const invoice = await getInvoice(share.invoiceId);
  if (!invoice) notFound();

  const documents = await listInvoiceDocuments(invoice.id);
  const pdfDoc = documents.find((d) => d.kind === "pdf");
  const zugDoc = documents.find((d) => d.kind === "zugferd");
  const xmlDoc = documents.find((d) => d.kind === "xrechnung");

  const h = await headers();
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("host") || "";
  const base = `${proto}://${host}`;
  const pdfUrl = `${base}/api/public/rechnung/${token}/pdf`;

  const accent = invoice.issuer.accentColor || "#1F6DD8";
  const statusColor = INVOICE_STATUS_COLOR[invoice.status] || "#94A3B8";
  const statusLabel = INVOICE_STATUS_LABEL[invoice.status] || invoice.status;
  const overdue =
    invoice.status !== "paid" &&
    invoice.status !== "cancelled" &&
    invoice.dueDate < new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-[#0B0D12] text-[#E5E7EB]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:py-12">
        <header className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#6B7280]">
                {invoice.issuer.brandLabel}
              </div>
              <h1 className="mt-1 text-2xl font-semibold text-white md:text-3xl">
                {invoice.invoiceNumber ? `Rechnung Nr. ${invoice.invoiceNumber}` : "Rechnung (Entwurf)"}
              </h1>
              <div className="mt-1 text-sm text-[#9CA3AF]">
                Für {invoice.customer.name} · {formatDeDate(invoice.invoiceDate)}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill color={overdue ? "#EF4444" : statusColor} label={overdue ? "Überfällig" : statusLabel} />
              <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-right">
                <div className="text-[10px] uppercase tracking-widest text-[#6B7280]">Gesamtbetrag</div>
                <div className="text-lg font-semibold" style={{ color: accent }}>
                  {formatEUR(invoice.totals.grossCents, invoice.totals.currency)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
            <Info label="Fällig am" value={formatDeDate(invoice.dueDate)} accent={overdue ? "#EF4444" : undefined} />
            <Info label="Leistungszeitraum" value={invoice.servicePeriod.label || "—"} />
            <Info label="Zahlungsziel" value={`${invoice.payment.paymentTermsDays} Tage`} />
            <Info label="Aussteller" value={invoice.issuer.legalName} />
          </div>

          {share.allowDownloads && (
            <div className="mt-5 flex flex-wrap gap-2">
              {pdfDoc && (
                <DownloadLink
                  href={`/api/public/rechnung/${token}/documents/${pdfDoc.id}`}
                  primary
                  accent={accent}
                >
                  PDF herunterladen
                </DownloadLink>
              )}
              {zugDoc && (
                <DownloadLink href={`/api/public/rechnung/${token}/documents/${zugDoc.id}`}>
                  ZUGFeRD (E-Rechnung)
                </DownloadLink>
              )}
              {xmlDoc && (
                <DownloadLink href={`/api/public/rechnung/${token}/documents/${xmlDoc.id}`}>
                  XRechnung XML
                </DownloadLink>
              )}
              {!pdfDoc && (
                <DownloadLink href={pdfUrl} primary accent={accent}>
                  PDF öffnen
                </DownloadLink>
              )}
            </div>
          )}
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white">
            <iframe
              title="Rechnungs-Vorschau"
              src={pdfUrl}
              className="h-[80vh] w-full border-0"
            />
          </div>
          <aside className="space-y-4">
            <Card title="Bankverbindung">
              <Row label="Empfänger" value={invoice.issuer.legalName} />
              <Row label="IBAN" value={invoice.payment.bank.iban} mono />
              <Row label="BIC" value={invoice.payment.bank.bic} mono />
              <Row label="Bank" value={invoice.payment.bank.bankName} />
              <Row label="Verwendungszweck" value={invoice.invoiceNumber ? `Rechnung ${invoice.invoiceNumber}` : "—"} mono />
            </Card>
            <Card title="Kontakt">
              {invoice.issuer.contact?.email && (
                <Row label="E-Mail" value={invoice.issuer.contact.email} />
              )}
              {invoice.issuer.contact?.website && (
                <Row label="Web" value={invoice.issuer.contact.website.replace(/^https?:\/\//, "")} />
              )}
              {invoice.issuer.contact?.phone && (
                <Row label="Telefon" value={invoice.issuer.contact.phone} />
              )}
            </Card>
          </aside>
        </section>

        <footer className="pb-6 pt-2 text-center text-[10px] text-[#4B5563]">
          Diese Seite ist ein sicherer, tokenbasierter Direktlink — nicht öffentlich indiziert.
        </footer>
      </div>
    </main>
  );
}

function StatusPill({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
      style={{ borderColor: `${color}66`, background: `${color}22`, color }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Info({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="text-[10px] uppercase tracking-widest text-[#6B7280]">{label}</div>
      <div className="mt-1 text-sm text-white" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}

function DownloadLink({
  href,
  children,
  primary,
  accent,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
  accent?: string;
}) {
  const base = "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold";
  if (primary) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} text-white`}
        style={{ background: accent ?? "#1F6DD8", boxShadow: `0 0 14px ${(accent ?? "#1F6DD8")}55` }}
      >
        ↓ {children}
      </a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} border border-white/10 bg-white/[0.02] text-white hover:bg-white/[0.06]`}
    >
      ↓ {children}
    </a>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-[10px] uppercase tracking-widest text-[#6B7280]">{title}</div>
      <div className="mt-2 space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-[#6B7280]">{label}</span>
      <span className={mono ? "tabular-nums text-white" : "text-white"}>{value}</span>
    </div>
  );
}
