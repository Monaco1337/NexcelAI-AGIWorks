import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "./lib/auth";
import {
  AGIWORKS_HOSTS,
  CANONICAL_DOMAIN,
  cleanAgiPath,
  isAgiInternalPath,
  isLocalOrPreviewHost,
  normalizeHost,
} from "./config/seo/domains";

const SHARED_TOP_LEVEL = [
  "/admin",
  "/login",
  "/demo",
  "/demo-anfordern",
  "/api",
  "/diagnose",
  "/verify-email",
];

function isSharedPath(path: string): boolean {
  return SHARED_TOP_LEVEL.some((p) => path === p || path.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const path = url.pathname;
  const host = normalizeHost(request.headers.get("host"));
  const isDevHost = isLocalOrPreviewHost(host);
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set("x-nonce", nonce);
  forwardedHeaders.set("content-security-policy", csp);

  // Browser session cookies protect admin APIs only when the mutation comes
  // from the same origin. Bearer-authenticated cron routes live outside this
  // prefix and are unaffected.
  if (
    path.startsWith("/api/admin/") &&
    !["GET", "HEAD", "OPTIONS"].includes(request.method)
  ) {
    const origin = request.headers.get("origin");
    const fetchSite = request.headers.get("sec-fetch-site");
    if (
      fetchSite === "cross-site" ||
      (origin && !isSameOrigin(origin, request.nextUrl.origin))
    ) {
      return secure(
        NextResponse.json({ error: "cross_origin_request_blocked" }, { status: 403 }),
        csp,
      );
    }
  }

  // ── Cross-domain URL ownership (hard 301) ────────────────────────────────
  // Canonical tags alone do NOT protect against cross-domain duplicates. The
  // internal /agiworks/* subtree must never be publicly reachable: it belongs
  // to agiworks.de as clean paths. Enforce with permanent redirects.
  // Skipped on localhost / preview so development keeps working.
  if (!isDevHost && isAgiInternalPath(path)) {
    const target = `${CANONICAL_DOMAIN.agiworks}${cleanAgiPath(path)}`;
    const dest = new URL(target);
    dest.search = url.search;
    return secure(NextResponse.redirect(dest, 301), csp);
  }

  // Host-based brand rewrite: agiworks.de/* serves /agiworks/* internally,
  // while the user-facing URL stays untouched (rewrite, not redirect).
  if (
    AGIWORKS_HOSTS.has(host) &&
    !path.startsWith("/agiworks") &&
    !isSharedPath(path)
  ) {
    const target = url.clone();
    target.pathname = path === "/" ? "/agiworks" : `/agiworks${path}`;
    const res = NextResponse.rewrite(target, { request: { headers: forwardedHeaders } });
    res.headers.set("x-active-brand", "agiworks");
    return secure(res, csp);
  }

  if (path.startsWith("/demo") && !path.startsWith("/demo-anfordern")) {
    const session = await verifySession();
    if (!session) {
      return secure(NextResponse.redirect(new URL("/login", request.url)), csp);
    }
  }

  if (path.startsWith("/admin")) {
    const session = await verifySession();

    if (path === "/admin/login" && session && session.role === "admin") {
      return secure(NextResponse.redirect(new URL("/admin", request.url)), csp);
    }

    if (path !== "/admin/login") {
      if (!session || session.role !== "admin") {
        return secure(NextResponse.redirect(new URL("/admin/login", request.url)), csp);
      }
    }
  }

  return secure(NextResponse.next({ request: { headers: forwardedHeaders } }), csp);
}

function isSameOrigin(origin: string, expected: string): boolean {
  try {
    return new URL(origin).origin === expected;
  } catch {
    return false;
  }
}

function contentSecurityPolicy(nonce: string): string {
  const developmentEval = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentEval}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com",
    "font-src 'self' data:",
    "connect-src 'self' https://huggingface.co https://*.huggingface.co https://*.hf.co wss:",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "manifest-src 'self'",
    process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "",
  ].filter(Boolean).join("; ");
}

function secure(response: NextResponse, csp: string): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    /*
     * Run on every route except Next.js internals and static assets.
     * The host-based brand rewrite must execute on every brand-relevant
     * request, so we cannot restrict the matcher to /demo and /admin
     * any longer. Files with an extension and `_next/*` are excluded
     * to avoid unnecessary middleware invocations.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)",
  ],
};
