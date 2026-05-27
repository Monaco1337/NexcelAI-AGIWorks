import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "./lib/auth";

const AGIWORKS_HOSTS = new Set([
  "agiworks.de",
  "www.agiworks.de",
]);

const SHARED_TOP_LEVEL = [
  "/admin",
  "/login",
  "/demo",
  "/demo-anfordern",
  "/api",
  "/diagnose",
  "/datenschutz",
  "/impressum",
  "/verify-email",
];

function isSharedPath(path: string): boolean {
  return SHARED_TOP_LEVEL.some((p) => path === p || path.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const path = url.pathname;
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();

  // Host-based brand rewrite: agiworks.de/* serves /agiworks/* internally,
  // while the user-facing URL stays untouched (rewrite, not redirect).
  if (
    AGIWORKS_HOSTS.has(host) &&
    !path.startsWith("/agiworks") &&
    !isSharedPath(path)
  ) {
    const target = url.clone();
    target.pathname = path === "/" ? "/agiworks" : `/agiworks${path}`;
    const res = NextResponse.rewrite(target);
    res.headers.set("x-active-brand", "agiworks");
    return res;
  }

  if (path.startsWith("/demo") && !path.startsWith("/demo-anfordern")) {
    const session = await verifySession();
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (path.startsWith("/admin")) {
    const session = await verifySession();

    if (path === "/admin/login" && session && session.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (path !== "/admin/login") {
      if (!session || session.role !== "admin") {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }
  }

  return NextResponse.next();
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
