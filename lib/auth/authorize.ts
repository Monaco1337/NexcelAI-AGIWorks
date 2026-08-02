/**
 * Serverseitige Autorisierung — die einzige Stelle, an der entschieden wird,
 * ob ein Aufruf zulässig ist.
 *
 * Bisher prüfte jede API-Route inline `session.role !== "admin"`. Das war an
 * einem Dutzend Stellen dupliziert und an zwei ganzen Routengruppen schlicht
 * vergessen worden (`/api/admin/systems`, `/api/admin/references` waren völlig
 * offen). Jede neue Route geht ab jetzt durch `authorize()`.
 *
 * Maßgeblich ist die Rolle aus `crm_users`, nicht die im JWT: das Token lebt
 * bis zu seinem Ablaufdatum weiter, eine Herabstufung im CRM muss aber sofort
 * greifen. Nur wenn die Datenbank nicht erreichbar ist, gilt ersatzweise die
 * Rolle aus dem Token.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifySession, type SessionPayload } from "@/lib/auth";
import {
  normalizeLegacyRole,
  roleHasPermission,
  type Permission,
  type Role,
} from "./roles";
import { getUserById, getUserByEmail, type CrmUser } from "@/lib/identity/usersStore";

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  role: Role;
  brand: "nexcel" | "agiworks" | null;
  orgId: string | null;
  /** Datensatz aus crm_users, falls die Spiegelung bereits gelaufen ist. */
  user: CrmUser | null;
  can: (permission: Permission) => boolean;
}

/**
 * Kurzlebiger Rollen-Cache pro Lambda-Instanz. Ohne ihn kostet jede
 * autorisierte Anfrage eine zusätzliche Abfrage; mit ihm greift eine
 * Rollenänderung um bis zu 30 Sekunden verzögert. Das ist der bewusste
 * Kompromiss — Sperrungen laufen zusätzlich über `is_active`, das bei jedem
 * Login neu ausgewertet wird.
 */
const ROLE_CACHE_TTL_MS = 30_000;
const roleCache = new Map<string, { user: CrmUser; expires: number }>();

export function invalidateAuthCache(userId?: string): void {
  if (userId) roleCache.delete(userId);
  else roleCache.clear();
}

async function resolveCrmUser(session: SessionPayload): Promise<CrmUser | null> {
  const cached = roleCache.get(session.userId);
  if (cached && cached.expires > Date.now()) return cached.user;

  try {
    // Zuerst über die ID, ersatzweise über die E-Mail: die IDs in der
    // JSON-Identitätsquelle sind nicht stabil, die E-Mail ist der
    // Abgleichsschlüssel der Spiegelung.
    const user =
      (await getUserById(session.userId)) ?? (await getUserByEmail(session.email));
    if (user) {
      roleCache.set(session.userId, { user, expires: Date.now() + ROLE_CACHE_TTL_MS });
    }
    return user;
  } catch (error) {
    console.error("[AUTH] crm_users nicht lesbar, nutze Token-Rolle:", error);
    return null;
  }
}

/**
 * Baut den Autorisierungskontext für die aktuelle Anfrage.
 * Gibt `null` zurück, wenn keine gültige Sitzung besteht.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await verifySession();
  if (!session) return null;

  const user = await resolveCrmUser(session);

  // Ein deaktivierter Nutzer verliert den Zugriff sofort, auch mit gültigem Token.
  if (user && !user.isActive) return null;

  const role: Role = user ? user.role : normalizeLegacyRole(session.role);

  return {
    userId: user?.id ?? session.userId,
    email: user?.email ?? session.email,
    name: user?.name ?? session.name ?? "",
    role,
    brand: user?.brand ?? session.brand ?? null,
    orgId: user?.orgId ?? null,
    user,
    can: (permission: Permission) => roleHasPermission(role, permission),
  };
}

export type AuthFailure = { ok: false; response: NextResponse };
export type AuthSuccess = { ok: true; auth: AuthContext };
export type AuthResult = AuthSuccess | AuthFailure;

function deny(status: 401 | 403, code: string): AuthFailure {
  return {
    ok: false,
    response: NextResponse.json({ error: code }, { status }),
  };
}

/**
 * Prüft Sitzung und Berechtigung in einem Schritt.
 *
 * Verwendung in einer Route:
 *   const gate = await authorize("ticket.update");
 *   if (!gate.ok) return gate.response;
 *   const { auth } = gate;
 */
export async function authorize(...required: Permission[]): Promise<AuthResult> {
  const auth = await getAuthContext();
  if (!auth) return deny(401, "unauthorized");

  for (const permission of required) {
    if (!auth.can(permission)) return deny(403, "forbidden");
  }
  return { ok: true, auth };
}

/** Nur Sitzung erforderlich, keine bestimmte Berechtigung. */
export async function authorizeAny(): Promise<AuthResult> {
  const auth = await getAuthContext();
  if (!auth) return deny(401, "unauthorized");
  return { ok: true, auth };
}

/** IP und User-Agent für das Audit-Log. */
export async function requestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    return {
      ip: forwarded ? forwarded.split(",")[0].trim() : h.get("x-real-ip"),
      userAgent: h.get("user-agent"),
    };
  } catch {
    return { ip: null, userAgent: null };
  }
}
