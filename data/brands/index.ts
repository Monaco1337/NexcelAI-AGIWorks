import type { BrandConfig } from "@/types/brand";
import { agiworksBrand } from "./agiworks";
import { nexcelBrand } from "./nexcel";

export { nexcelBrand, agiworksBrand };

export function getBrandFromPathname(pathname: string): BrandConfig {
  const path = pathname || "/";
  if (path === "/agiworks" || path.startsWith("/agiworks/")) {
    return agiworksBrand;
  }
  return nexcelBrand;
}
