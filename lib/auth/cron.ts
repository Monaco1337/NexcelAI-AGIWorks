import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "./authorize";
import type { Permission } from "./roles";

export async function authorizeCronOrPermission(
  request: NextRequest,
  permission: Permission,
): Promise<
  | { ok: true; actorId: string | null }
  | { ok: false; response: NextResponse }
> {
  const secret = process.env.CRON_SECRET?.trim();
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (secret && provided && safeEqual(provided, secret)) return { ok: true, actorId: null };

  const session = await authorize(permission);
  if (session.ok) return { ok: true, actorId: session.auth.userId };

  const misconfigured = !secret && process.env.NODE_ENV === "production";
  return {
    ok: false,
    response: NextResponse.json(
      {
        error: misconfigured ? "cron_not_configured" : "forbidden",
        message: misconfigured ? "CRON_SECRET ist nicht konfiguriert" : "Cron-Aufruf nicht autorisiert",
      },
      { status: misconfigured ? 503 : 401 },
    ),
  };
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

