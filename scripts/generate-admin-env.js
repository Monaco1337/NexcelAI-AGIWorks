#!/usr/bin/env node
/**
 * Generates a JSON payload for the `ADMIN_USERS` env var from
 * `data/demo-users.json`. Useful when rotating credentials or
 * onboarding a new admin: edit the JSON file locally, run this script,
 * copy the output into the Vercel dashboard (or pipe it into
 * `vercel env add ADMIN_USERS production`).
 *
 * Usage:
 *   node scripts/generate-admin-env.js                   # prints JSON
 *   node scripts/generate-admin-env.js --pretty          # prints indented
 *   node scripts/generate-admin-env.js --vercel prod     # push to Vercel
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

const USERS_FILE = path.join(process.cwd(), "data", "demo-users.json");

if (!fs.existsSync(USERS_FILE)) {
  console.error(`No users file at ${USERS_FILE}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
const admins = raw
  .filter((u) => u && u.role === "admin" && u.passwordHash && u.email)
  .map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    passwordHash: u.passwordHash,
    role: "admin",
    brand: u.brand ?? null,
    createdAt: u.createdAt,
    expiresAt: u.expiresAt,
  }));

const args = process.argv.slice(2);
const pretty = args.includes("--pretty");
const vercelIdx = args.indexOf("--vercel");
const vercelTarget = vercelIdx >= 0 ? args[vercelIdx + 1] : null;

const json = pretty ? JSON.stringify(admins, null, 2) : JSON.stringify(admins);

if (vercelTarget) {
  const tmpFile = path.join(os.tmpdir(), `admin-users-${Date.now()}.txt`);
  fs.writeFileSync(tmpFile, JSON.stringify(admins), "utf-8");
  try {
    execSync(`vercel env rm ADMIN_USERS ${vercelTarget} --yes`, { stdio: "ignore" });
  } catch {
    /* ignore — variable might not exist yet */
  }
  execSync(`vercel env add ADMIN_USERS ${vercelTarget} < "${tmpFile}"`, {
    stdio: "inherit",
    shell: "/bin/bash",
  });
  fs.unlinkSync(tmpFile);
  console.log(`\n✅ Pushed ADMIN_USERS (${admins.length} admins) to ${vercelTarget}`);
} else {
  console.log(json);
  console.error(`\n${admins.length} admin(s) exported.`);
  if (!pretty) {
    console.error("Pipe into: vercel env add ADMIN_USERS production");
  }
}
