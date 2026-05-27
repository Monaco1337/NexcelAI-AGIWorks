import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect /demo routes
  if (path.startsWith("/demo") && !path.startsWith("/demo-anfordern")) {
    const session = await verifySession();
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Handle /admin routes
  if (path.startsWith("/admin")) {
    const session = await verifySession();
    
    // If trying to access /admin/login while already logged in as admin, redirect to dashboard
    if (path === "/admin/login" && session && session.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    
    // Protect all other /admin routes (require admin session)
    if (path !== "/admin/login") {
      if (!session || session.role !== "admin") {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/demo/:path*", "/admin/:path*"],
};

