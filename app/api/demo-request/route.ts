import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, isEmailExists } from "@/lib/demo-users";

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 Stunde
const MAX_REQUESTS = 3;

function getRateLimitKey(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  return `demo-request-${ip}`;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const limit = RATE_LIMIT.get(key);

  if (!limit || now > limit.resetAt) {
    RATE_LIMIT.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (limit.count >= MAX_REQUESTS) {
    return false;
  }

  limit.count++;
  return true;
}

function generatePassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

async function sendDemoEmail(email: string, name: string, password: string, expiresAt: string) {
  const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"}/login`;
  const expiresDate = new Date(expiresAt).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const emailBody = `
Hallo ${name},

vielen Dank für dein Interesse an Chronex AI!

Dein Demo-Zugang wurde erstellt:

Login-URL: ${loginUrl}
E-Mail: ${email}
Passwort: ${password}

Dein Demo-Zugang ist gültig bis: ${expiresDate}

Bitte bewahre diese Zugangsdaten sicher auf.

Bei Fragen kannst du dich jederzeit an mich wenden.

Viel Erfolg mit Chronex AI!

Beste Grüße
Celina Siebeneicher
NEXCEL AI
  `.trim();

  console.log("=== DEMO-ZUGANG ERSTELLT ===");
  console.log(`E-Mail: ${email}`);
  console.log(`Passwort: ${password}`);
  console.log(`Ablaufdatum: ${expiresDate}`);
  console.log("=============================");
  console.log("\nE-Mail-Inhalt:");
  console.log(emailBody);
  console.log("\n=============================");

  // TODO: Hier echten E-Mail-Versand implementieren (z.B. mit nodemailer, sendgrid, etc.)
  // await sendEmail({
  //   to: email,
  //   subject: "Dein Chronex AI Demo-Zugang",
  //   html: emailBody.replace(/\n/g, "<br>"),
  // });
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitKey = getRateLimitKey(req);
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte versuche es später erneut." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, unternehmen } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name und E-Mail sind erforderlich." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse." },
        { status: 400 }
      );
    }

    if (isEmailExists(email)) {
      return NextResponse.json(
        { error: "Für diese E-Mail-Adresse existiert bereits ein Demo-Zugang." },
        { status: 409 }
      );
    }

    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const user = createUser({
      email: email.toLowerCase(),
      name,
      unternehmen,
      passwordHash,
      role: "demo_user",
      expiresAt: expiresAt.toISOString(),
    });

    await sendDemoEmail(user.email, user.name, password, user.expiresAt);

    // Save demo request to database
    const { saveDemoRequest } = await import("@/lib/database");
    saveDemoRequest({
      name: user.name,
      email: user.email,
      unternehmen: user.unternehmen,
      expiresAt: user.expiresAt,
    });

    // Track analytics
    const { saveAnalyticsEvent } = await import("@/lib/database");
    const ip = req.headers.get("x-forwarded-for") || 
               req.headers.get("x-real-ip") || 
               "unknown";
    saveAnalyticsEvent({
      type: "demo_request",
      page: "/demo-anfordern",
      ip,
      metadata: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      message: "Demo-Zugang wurde erstellt. Bitte prüfe dein E-Mail-Postfach.",
    });
  } catch (error) {
    console.error("Error creating demo request:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}

