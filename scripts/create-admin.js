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

async function createAdmin() {
  const email = process.argv[2] || "admin@nexcel-ai.de";
  const password = process.argv[3] || "admin123";
  const name = process.argv[4] || "Admin";

  const users = readUsers();
  
  // Check if admin already exists
  const existingAdmin = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.role === "admin");
  if (existingAdmin) {
    console.log("❌ Admin mit dieser E-Mail existiert bereits!");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 10); // 10 Jahre gültig

  const newAdmin = {
    id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: email.toLowerCase(),
    name,
    passwordHash,
    role: "admin",
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  users.push(newAdmin);
  writeUsers(users);

  console.log("✅ Admin erfolgreich erstellt!");
  console.log("📧 E-Mail:", email);
  console.log("🔑 Passwort:", password);
  console.log("👤 Name:", name);
  console.log("\n⚠️  WICHTIG: Ändere das Passwort nach dem ersten Login!");
}

createAdmin().catch(console.error);

