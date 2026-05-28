type Props = {
  accentRgb: string;
  /** Linker Teil (Dienst / Produktlinie), neutral */
  serviceLabel: string;
  /** Firmenname nach „× by“ — in Markenfarbe */
  brandName: string;
  variant?: "header" | "embed";
};

/**
 * Signatur: [Dienst neutral] · [× by Markenname in Akzentfarbe]
 */
export function WizardSignature({ accentRgb, serviceLabel, brandName, variant = "header" }: Props) {
  const serviceClass =
    variant === "header"
      ? "text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42"
      : "text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 sm:text-[11px]";

  const attrClass =
    variant === "header"
      ? "text-[10px] sm:text-[10.5px]"
      : "text-[9px] sm:text-[10px]";

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
      <span className={serviceClass}>{serviceLabel}</span>
      <span className={`inline-flex items-baseline gap-0.5 font-medium ${attrClass} text-white/38`}>
        <span
          className={`select-none font-extralight text-white/28 ${
            variant === "header" ? "text-[11px] leading-none" : "text-[10px] leading-none sm:text-[11px]"
          }`}
          aria-hidden
        >
          ×
        </span>
        <span className="ml-0.5 font-normal lowercase tracking-[0.04em] text-white/32">by</span>
        <span
          className="ml-0.5 font-semibold uppercase tracking-[0.12em]"
          style={{
            color: `rgba(${accentRgb},0.96)`,
            textShadow: `0 0 22px rgba(${accentRgb},0.32)`,
          }}
        >
          {brandName}
        </span>
      </span>
    </span>
  );
}
