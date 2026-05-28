import fs from "fs";
import path from "path";

export type BrandKey = "agiworks" | "nexcel";

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  unternehmen?: string;
  passwordHash: string;
  role: "demo_user" | "admin";
  /**
   * Brand affiliation for admin users. Determines the welcome screen
   * accent and the default filter selection in the admin panel. Optional
   * for legacy users — they fall back to "nexcel" in the UI.
   */
  brand?: BrandKey;
  createdAt: string;
  expiresAt: string;
  lastLogin?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "demo-users.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readFileUsers(): DemoUser[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    if (!data || data.trim() === "") return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.error("Error reading users file:", error);
    return [];
  }
}

/**
 * Reads admin definitions from the `ADMIN_USERS` environment variable.
 *
 * The variable must contain a JSON array of objects matching the DemoUser
 * shape. Required fields per entry: `email`, `name`, `passwordHash`, `role`.
 * Optional: `id`, `brand`, `createdAt`, `expiresAt`, `unternehmen`.
 *
 * This is the production-friendly path: in serverless deployments the
 * file system is read-only, so admins live in env vars rather than on disk.
 */
function readEnvUsers(): DemoUser[] {
  const raw = process.env.ADMIN_USERS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = new Date();
    const farFuture = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);
    return parsed
      .filter(
        (u): u is Partial<DemoUser> =>
          !!u && typeof u === "object" && typeof u.email === "string" && typeof u.passwordHash === "string",
      )
      .map((u) => ({
        id: u.id ?? `env_${Buffer.from(u.email!.toLowerCase()).toString("hex").slice(0, 16)}`,
        email: u.email!.toLowerCase(),
        name: u.name ?? u.email!,
        unternehmen: u.unternehmen,
        passwordHash: u.passwordHash!,
        role: (u.role as DemoUser["role"]) ?? "admin",
        brand: u.brand,
        createdAt: u.createdAt ?? now.toISOString(),
        expiresAt: u.expiresAt ?? farFuture.toISOString(),
        lastLogin: u.lastLogin,
      }));
  } catch (error) {
    console.error("[demo-users] Invalid ADMIN_USERS env JSON:", error);
    return [];
  }
}

/**
 * Combined view: env-defined admins take precedence over file-based
 * entries with the same email, so production deploys can ship admins
 * via env without touching the on-disk JSON.
 */
function readAllUsers(): DemoUser[] {
  const envUsers = readEnvUsers();
  const fileUsers = readFileUsers();
  const seen = new Set(envUsers.map((u) => u.email.toLowerCase()));
  const merged: DemoUser[] = [...envUsers];
  for (const u of fileUsers) {
    if (!u || !u.email) continue;
    const key = u.email.toLowerCase();
    if (!seen.has(key)) {
      merged.push(u);
      seen.add(key);
    }
  }
  return merged;
}

function writeFileUsers(users: DemoUser[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export function findUserByEmail(email: string): DemoUser | null {
  try {
    if (!email || typeof email !== "string") return null;
    const target = email.toLowerCase();
    const users = readAllUsers();
    return users.find((u) => u && u.email && u.email.toLowerCase() === target) || null;
  } catch (error) {
    console.error("Error finding user by email:", error);
    return null;
  }
}

export function findUserById(id: string): DemoUser | null {
  const users = readAllUsers();
  return users.find((u) => u.id === id) || null;
}

export function listAdmins(): DemoUser[] {
  return readAllUsers().filter((u) => u.role === "admin");
}

export function createUser(user: Omit<DemoUser, "id" | "createdAt">): DemoUser {
  const users = readFileUsers();
  const newUser: DemoUser = {
    ...user,
    id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeFileUsers(users);
  return newUser;
}

export function updateUser(id: string, updates: Partial<DemoUser>): DemoUser | null {
  // Env-defined users are read-only — updates only persist to file storage.
  const fileUsers = readFileUsers();
  const index = fileUsers.findIndex((u) => u.id === id);
  if (index === -1) {
    // Falls der User nur in env existiert: still return the merged record
    // (mit Update angewendet) ohne zu persistieren — sonst würden lastLogin-
    // Aufrufe für env-Admins fehlschlagen.
    const envUser = readEnvUsers().find((u) => u.id === id);
    if (envUser) return { ...envUser, ...updates };
    return null;
  }
  fileUsers[index] = { ...fileUsers[index], ...updates };
  writeFileUsers(fileUsers);
  return fileUsers[index];
}

export function isEmailExists(email: string): boolean {
  return findUserByEmail(email) !== null;
}
