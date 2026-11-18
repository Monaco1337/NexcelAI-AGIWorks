"use client";

// AGI_LOCAL_BRAND_LINK_V1
import NextLink from "next/link";
import { useEffect, useState, type ComponentProps } from "react";
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

  // Initial SSR and hydration always emit public clean hrefs.
  // Only an explicit local/preview /agiworks route may restore the internal
  // prefix after mount. A production host rewrite must never cause it.
  const [isLocalAgi, setIsLocalAgi] = useState(false);
  useEffect(() => {
    const host = window.location.hostname.toLowerCase();
    const isPreview = host === "localhost" || host === "127.0.0.1" ||
      host.endsWith(".localhost") || host.endsWith(".vercel.app");
    setIsLocalAgi(
      brand.id === "agiworks" && isPreview &&
      (pathname === "/agiworks" || pathname.startsWith("/agiworks/"))
    );
  }, [brand.id, pathname]);

  let destination: Props["href"] = href;

  if (typeof href === "string" && brand.id === "agiworks") {
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
      // Public domains use CLEAN paths. The /agiworks prefix is only for
      // explicit local/preview /agiworks/* routes with no host rewrite.
      destination = isLocalAgi
        ? clean === "/" ? "/agiworks" : "/agiworks" + clean
        : clean;
    } else {
      destination = clean;
    }
  }

  return <NextLink {...props} href={destination} />;
}
