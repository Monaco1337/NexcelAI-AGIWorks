"use client";

// AGI_LOCAL_BRAND_LINK_V1
import NextLink from "next/link";
import type { ComponentProps } from "react";
import { usePathname } from "next/navigation";
import { useBrand } from "@/contexts/BrandContext";
import { resolveBrandNavHref } from "@/lib/brandNav";

type Props = ComponentProps<typeof NextLink>;

export default function BrandAwareLink({
  href,
  ...props
}: Props) {
  const pathname = usePathname() || "/";
  const brand = useBrand();

  const isLocalAgi =
    brand.id === "agiworks" &&
    (pathname === "/agiworks" ||
      pathname.startsWith("/agiworks/"));

  let destination: Props["href"] = href;

  if (typeof href === "string" && isLocalAgi) {
    let clean = resolveBrandNavHref(href, brand.id);

    if (clean.startsWith("/agiworks?")) {
      clean = "/" + clean.slice("/agiworks".length);
    }

    const internal =
      clean.startsWith("/") &&
      !clean.startsWith("//");

    const shared = [
      "/api",
      "/admin",
      "/login",
      "/demo",
      "/demo-anfordern",
      "/diagnose",
      "/verify-email",
      "/_next",
    ].some((prefix) =>
      clean === prefix || clean.startsWith(prefix + "/")
    );

    if (internal && !shared) {
      destination =
        clean === "/" ? "/agiworks" : "/agiworks" + clean;
    }
  }

  return <NextLink {...props} href={destination} />;
}
