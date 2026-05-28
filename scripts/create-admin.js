const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "demo-users.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readUsers() {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeUsers(users) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

/**
 * Usage:
 *   node scripts/create-admin.js <email> <password> <name> [brand]
 *   brand: "agiworks" | "nexcel" (default: nexcel)
 *
 * Example:
 *   node scripts/create-admin.js kevin@agiworks.de change-me-2026 Kevin agiworks
 */
async function createAdmin() {
  const email = process.argv[2] || "admin@nexcelai.de";
  const password = process.argv[3] || "admin123";
  const name = process.argv[4] || "Admin";
  const brandArg = (process.argv[5] || "nexcel").toLowerCase();
  const brand = brandArg === "agiworks" ? "agiworks" : "nexcel";

  const users = readUsers();

  // Check if admin already exists
  const existingAdmin = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.role === "admin");
  if (existingAdmin) {
    console.log("❌ Admin mit dieser E-Mail existiert bereits!");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 10);

  const newAdmin = {
    id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: email.toLowerCase(),
    name,
    passwordHash,
    role: "admin",
    brand,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  users.push(newAdmin);
  writeUsers(users);

  console.log("✅ Admin erfolgreich erstellt!");
  console.log("📧 E-Mail:", email);
  console.log("🔑 Passwort:", password);
  console.log("👤 Name:", name);
  console.log("🏷️  Brand:", brand);
  console.log("\n⚠️  WICHTIG: Ändere das Passwort nach dem ersten Login!");
  console.log("\nNächster Schritt: Damit der Admin auch in Production verfügbar ist:");
  console.log("  node scripts/generate-admin-env.js --vercel production");
}

createAdmin().catch(console.error);

