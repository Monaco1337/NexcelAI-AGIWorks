import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (!command) throw new Error("Usage: with-disposable-postgres <command> [...args]");
  const port = await availablePort();
  const databaseDir = await mkdtemp(join(tmpdir(), "nexcel-postgres-"));
  const user = "postgres";
  const password = `nexcel_${crypto.randomUUID().replace(/-/g, "")}`;
  const database = "nexcel_acceptance";
  const postgres = new EmbeddedPostgres({
    databaseDir,
    port,
    user,
    password,
    authMethod: "scram-sha-256",
    persistent: false,
    onLog: () => undefined,
    onError: (error) => console.error(error),
  });
  let exitCode = 1;
  try {
    await postgres.initialise();
    await postgres.start();
    await postgres.createDatabase(database);
    const connectionUrl =
      `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}` +
      `@127.0.0.1:${port}/${database}`;
    exitCode = await run(command, args, {
      ...process.env,
      POSTGRES_URL: connectionUrl,
      DATABASE_URL: connectionUrl,
      POSTGRES_SSL: "false",
    });
  } finally {
    await postgres.stop().catch((error) => {
      console.error("Failed to stop disposable PostgreSQL", error);
    });
  }
  if (exitCode !== 0) {
    throw new Error(`${command} exited with status ${exitCode}`);
  }
}

function run(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error(`${command} terminated by ${signal}`));
      else resolve(code ?? 1);
    });
  });
}

function availablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close((error) => {
        if (error) reject(error);
        else if (port === null) reject(new Error("Could not allocate PostgreSQL port"));
        else resolve(port);
      });
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
