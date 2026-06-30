/**
 * NEXCEL AI / AGI WORKS · Standard-Kundenlogos
 *
 * Einzige Quelle der fest hinterlegten Logos. Wird sowohl vom öffentlichen
 * Slider (Fallback ohne DB) als auch vom Admin-Panel (einmaliger Import in
 * die Datenbank) verwendet.
 */

export type DefaultLogo = {
  name: string;
  src: string;
  /** Tailwind-Klassen für max-h / max-w Balance */
  className: string;
  /** CSS-filter-Korrektur für dunklen Hintergrund */
  filterStyle: string;
};

export const DEFAULT_LOGOS: DefaultLogo[] = [
  {
    name: "Lulu's Beauty",
    src: "/lulus-beauty.png",
    className: "max-h-[50px] max-w-[50px] sm:max-h-[60px] sm:max-w-[60px]",
    filterStyle: "invert(1) brightness(0.90) opacity(0.78)",
  },
  {
    name: "BeautyBar Akademie",
    src: "/beautybar-akademie.png",
    className: "max-h-[60px] max-w-[60px] sm:max-h-[70px] sm:max-w-[70px]",
    filterStyle: "brightness(0.95) opacity(0.80)",
  },
  {
    name: "Impuls Ambulanter Pflegedienst",
    src: "/impuls-pflegedienst.png",
    className: "max-h-[36px] max-w-[180px] sm:max-h-[42px] sm:max-w-[206px]",
    filterStyle: "invert(1) brightness(0.88) opacity(0.78)",
  },
  {
    name: "PflegeNest Bochum",
    src: "/pflegenest-bochum.png",
    className: "max-h-[64px] max-w-[64px] sm:max-h-[76px] sm:max-w-[76px]",
    filterStyle: "brightness(0) invert(1) opacity(0.78)",
  },
  {
    name: "Borne-Run",
    src: "/borne-run.png",
    className: "max-h-[40px] max-w-[160px] sm:max-h-[46px] sm:max-w-[184px] rounded-lg",
    filterStyle: "brightness(1.05) opacity(0.88)",
  },
  {
    name: "Immobilien Weissleder",
    src: "/immobilien-weissleder.png",
    className: "max-h-[38px] max-w-[200px] sm:max-h-[44px] sm:max-w-[228px]",
    filterStyle: "brightness(0) invert(1) opacity(0.75)",
  },
  {
    name: "AGI Energy",
    src: "/agi-energy.png",
    className: "max-h-[36px] max-w-[168px] sm:max-h-[42px] sm:max-w-[192px] rounded-lg",
    filterStyle: "brightness(1.08) opacity(0.90)",
  },
  {
    name: "Lokführerzentrum",
    src: "/lokfuehrerzentrum.png",
    className: "max-h-[40px] max-w-[200px] sm:max-h-[46px] sm:max-w-[228px] rounded-sm",
    filterStyle: "brightness(0) invert(1) opacity(0.78)",
  },
  {
    name: "Cannabbros",
    src: "/cannabbros.png",
    className: "max-h-[64px] max-w-[64px] sm:max-h-[76px] sm:max-w-[76px]",
    filterStyle: "brightness(2.2) contrast(0.80) opacity(0.80)",
  },
  {
    name: "Anatoly Mook",
    src: "/anatoly-mook.png",
    className: "max-h-[52px] max-w-[156px] sm:max-h-[62px] sm:max-w-[178px] rounded-lg",
    filterStyle: "brightness(1.10) opacity(0.88)",
  },
];
