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

async function resetAdminPassword() {
  const email = process.argv[2] || "celina.siebeneicher@outlook.com";
  const newPassword = process.argv[3] || "admin123";

  const users = readUsers();
  
  // Find admin user
  const adminIndex = users.findIndex(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.role === "admin"
  );
  
  if (adminIndex === -1) {
    console.log("❌ Admin mit dieser E-Mail wurde nicht gefunden!");
    console.log("Verfügbare Admins:");
    users
      .filter((u) => u.role === "admin")
      .forEach((admin) => {
        console.log(`  - ${admin.email}`);
      });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  users[adminIndex].passwordHash = passwordHash;
  
  writeUsers(users);

  console.log("✅ Admin-Passwort erfolgreich zurückgesetzt!");
  console.log("📧 E-Mail:", email);
  console.log("🔑 Neues Passwort:", newPassword);
  console.log("\n⚠️  WICHTIG: Ändere das Passwort nach dem Login im Admin-Bereich!");
}

resetAdminPassword().catch(console.error);

