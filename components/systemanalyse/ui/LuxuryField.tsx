"use client";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  accentRgb: string;
};

export function LuxuryField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  accentRgb,
}: Props) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
        {label}
        {required ? <span style={{ color: `rgb(${accentRgb.split(",").map((s) => s.trim()).join(",")})` }}> · erforderlich</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={type === "email" ? "email" : type === "tel" ? "tel" : "organization"}
        className="w-full rounded-xl bg-white/[0.04] px-4 py-3.5 text-[15px] text-white/95 placeholder:text-white/28 outline-none transition-[box-shadow,border-color,background] duration-200"
        style={{
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.2)",
        }}
        onFocus={(e) => {
          e.target.style.background = "rgba(255,255,255,0.055)";
          e.target.style.borderColor = `rgba(${accentRgb},0.45)`;
          e.target.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 3px rgba(${accentRgb},0.14), 0 14px 34px rgba(0,0,0,0.3)`;
        }}
        onBlur={(e) => {
          e.target.style.background = "";
          e.target.style.borderColor = "";
          e.target.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.2)";
        }}
      />
    </div>
  );
}

export function LuxuryTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
  required,
  accentRgb,
  hint,
}: Props & { rows?: number; hint?: string }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
        {label}
        {required ? <span className="text-white/30"> · erforderlich</span> : null}
      </label>
      {hint ? <p className="text-xs text-white/35 leading-relaxed">{hint}</p> : null}
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full min-h-[120px] resize-y rounded-xl bg-white/[0.04] px-4 py-3.5 text-[15px] text-white/95 placeholder:text-white/28 outline-none transition-[box-shadow,border-color,background] duration-200"
        style={{
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.2)",
        }}
        onFocus={(e) => {
          e.target.style.background = "rgba(255,255,255,0.055)";
          e.target.style.borderColor = `rgba(${accentRgb},0.45)`;
          e.target.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 3px rgba(${accentRgb},0.14), 0 14px 34px rgba(0,0,0,0.3)`;
        }}
        onBlur={(e) => {
          e.target.style.background = "";
          e.target.style.borderColor = "";
          e.target.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.2)";
        }}
      />
    </div>
  );
}
