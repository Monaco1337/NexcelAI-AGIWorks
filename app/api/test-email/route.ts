import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { authorize } from "@/lib/auth/authorize";
import {
  targetErrorResponse,
  testEmailQuerySchema,
  validateContract,
} from "@/lib/sales/targets/contracts";

/**
 * Test endpoint to verify email functionality
 * POST /api/test-email?to=test@example.com
 */
export async function POST(request: NextRequest) {
  const gate = await authorize("crm.content.manage");
  if (!gate.ok) return gate.response;

  const enabled =
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_TEST_EMAIL_ENDPOINT === "true";
  if (!enabled) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const parsed = validateContract(testEmailQuerySchema, {
    to: request.nextUrl.searchParams.get("to") || gate.auth.email,
  });
  if (!parsed.ok) return targetErrorResponse(parsed.error);

  try {
    const testEmail = parsed.data.to;

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

    const response: Record<string, unknown> = {
      success: result.success,
      message: result.success 
        ? "Test-E-Mail wurde versendet (oder im DEV-Mode geloggt)" 
        : "Fehler beim Versenden der Test-E-Mail",
      testEmail,
    };
    if (process.env.NODE_ENV !== "production") {
      response.error = result.error;
      response.debugInfo = result.debugInfo;
    }
    return NextResponse.json(response, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({
      success: false,
      error: process.env.NODE_ENV === "production"
        ? "email_test_failed"
        : error instanceof Error ? error.message : "Unbekannter Fehler",
    }, { status: 500 });
  }
}

