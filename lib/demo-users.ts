import fs from "fs";
import path from "path";

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  unternehmen?: string;
  passwordHash: string;
  role: "demo_user" | "admin";
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

function readUsers(): DemoUser[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(USERS_FILE)) {
      console.warn(`Users file not found at ${USERS_FILE}`);
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    if (!data || data.trim() === "") {
      console.warn("Users file is empty");
      return [];
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      console.error("Users file does not contain an array");
      return [];
    }
    return parsed;
  } catch (error) {
    console.error("Error reading users file:", error);
    return [];
  }
}

function writeUsers(users: DemoUser[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export function findUserByEmail(email: string): DemoUser | null {
  try {
    if (!email || typeof email !== "string") {
      return null;
    }
    const users = readUsers();
    return users.find((u) => u && u.email && u.email.toLowerCase() === email.toLowerCase()) || null;
  } catch (error) {
    console.error("Error finding user by email:", error);
    return null;
  }
}

export function findUserById(id: string): DemoUser | null {
  const users = readUsers();
  return users.find((u) => u.id === id) || null;
}

export function createUser(user: Omit<DemoUser, "id" | "createdAt">): DemoUser {
  const users = readUsers();
  const newUser: DemoUser = {
    ...user,
    id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeUsers(users);
  return newUser;
}

export function updateUser(id: string, updates: Partial<DemoUser>): DemoUser | null {
  const users = readUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...updates };
  writeUsers(users);
  return users[index];
}

export function isEmailExists(email: string): boolean {
  return findUserByEmail(email) !== null;
}

