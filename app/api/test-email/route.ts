import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

/**
 * Test endpoint to verify email functionality
 * GET /api/test-email?to=test@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // Resend allows onboarding@resend.dev only to send to the account owner's email
    // For testing, use the registered account email or verify a domain
    const testEmail = searchParams.get("to") || "55c8xz5mq9@privaterelay.appleid.com";

    const testHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test Email</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h1 style="color: #A45CFF; margin-bottom: 20px;">✅ Test E-Mail erfolgreich!</h1>
    <p style="color: #333; line-height: 1.6;">
      Diese E-Mail wurde erfolgreich von der NEXCEL AI Website versendet.
    </p>
    <p style="color: #666; margin-top: 20px; font-size: 14px;">
      Wenn Sie diese E-Mail erhalten haben, funktioniert das E-Mail-System korrekt.
    </p>
    <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
      <p style="margin: 0; color: #666; font-size: 12px;">
        <strong>Test-Zeitpunkt:</strong> ${new Date().toLocaleString("de-DE")}
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const result = await sendEmail({
      to: testEmail,
      subject: "✅ Test E-Mail von NEXCEL AI",
      html: testHTML,
    });

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? "Test-E-Mail wurde versendet (oder im DEV-Mode geloggt)" 
        : "Fehler beim Versenden der Test-E-Mail",
      error: result.error,
      debugInfo: result.debugInfo,
      testEmail,
      note: result.debugInfo?.mode === "development" 
        ? "⚠️ DEV MODE: E-Mail wurde nur in der Console geloggt. Setze RESEND_API_KEY in .env.local für echte E-Mails."
        : "✅ E-Mail wurde über Resend API versendet",
    }, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    }, { status: 500 });
  }
}

