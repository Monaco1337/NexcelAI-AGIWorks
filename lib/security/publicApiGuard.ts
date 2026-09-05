import { NextResponse, type NextRequest } from "next/server";
import { rateLimitDistributed, rateLimitKey } from "./rateLimit";

export async function guardPublicApi(
  request: NextRequest,
  scope: string,
  config: { max: number; windowMs: number },
): Promise<NextResponse | null> {
  const result = await rateLimitDistributed(rateLimitKey(scope, request.headers), config);
  if (result.allowed) return null;
  return NextResponse.json(
    {
      error:
        result.reason === "backend_unavailable"
          ? "Schutzdienst vorübergehend nicht verfügbar."
          : "Zu viele Anfragen.",
    },
    {
      status: result.reason === "backend_unavailable" ? 503 : 429,
      headers: { "Retry-After": String(result.retryAfter) },
    },
  );
}

