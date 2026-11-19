import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { DemoUser } from "./demo-users";

function signingSecret(): Uint8Array | null {
  const value = process.env.JWT_SECRET;
  return value && value.length >= 32 ? new TextEncoder().encode(value) : null;
}

export async function createSession(user: DemoUser) {
  const secret = signingSecret();
  if (!secret) throw new Error("JWT_SECRET missing or too short");
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
    .sign(secret);

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
  const secret = signingSecret();
  if (!secret) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
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

