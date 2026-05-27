import { NextRequest, NextResponse } from "next/server";
import { verifyContactEmail } from "@/lib/database";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                    request.nextUrl.origin;

    if (!token) {
      return NextResponse.redirect(
        new URL("/verify-email?error=missing_token", baseUrl)
      );
    }

    // Verify the email
    const contact = await verifyContactEmail(token);

    if (!contact) {
      return NextResponse.redirect(
        new URL("/verify-email?error=invalid_token", baseUrl)
      );
    }

    // Success - redirect to success page
    return NextResponse.redirect(
      new URL(`/verify-email?success=true&email=${encodeURIComponent(contact.email)}`, baseUrl)
    );
  } catch (error) {
    console.error("Email verification error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                    request.nextUrl.origin;
    return NextResponse.redirect(
      new URL("/verify-email?error=server_error", baseUrl)
    );
  }
}

