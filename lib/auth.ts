import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { DemoUser } from "./demo-users";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nexcel-ai-demo-secret-key-change-in-production"
);

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
    .sign(SECRET);

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
    const { payload } = await jwtVerify(token, SECRET);
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

