import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { DemoUser } from "./demo-users";

const DEVELOPMENT_SECRET = "nexcel-ai-demo-secret-key-change-in-production";
let encodedSecret: Uint8Array | null = null;

/**
 * Local development keeps the historical zero-config secret. Production and
 * preview runtimes fail closed: no session may be signed or verified without
 * an explicitly configured, non-demo secret of sufficient entropy.
 */
function getJwtSecret(): Uint8Array {
  if (encodedSecret) return encodedSecret;

  const configured = process.env.JWT_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === "production";
  if (
    isProduction &&
    (!configured || configured === DEVELOPMENT_SECRET || configured.length < 32)
  ) {
    throw new Error(
      "Authentication is unavailable: JWT_SECRET must be configured with at least 32 characters"
    );
  }

  encodedSecret = new TextEncoder().encode(configured || DEVELOPMENT_SECRET);
  return encodedSecret;
}

export async function createSession(user: DemoUser) {
  const expiresAt = new Date(user.expiresAt);
  const now = new Date();
  
  if (expiresAt < now) {
    return null;
  }

  const session = await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    brand: user.brand ?? null,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getJwtSecret());

  return session;
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  brand: "agiworks" | "nexcel" | null;
  name?: string;
}

export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      brand: (payload.brand as SessionPayload["brand"]) ?? null,
      name: payload.name as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

