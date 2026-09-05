import fs from "node:fs/promises";

const controlledFiles = [
  "app/api/scanner/fetch/route.ts",
  "app/api/hero-analyze/route.ts",
  "lib/diagnostics/services/websiteScan.ts",
];

async function main(): Promise<void> {
  const failures: string[] = [];
  for (const file of controlledFiles) {
    const source = await fs.readFile(file, "utf8");
    if (!source.includes("safeFetch")) failures.push(`${file}: safeFetch boundary missing`);
    if (/fetch\s*\(\s*(?:url|parsed|rawUrl|urlStr)/.test(source)) {
      failures.push(`${file}: direct user-controlled fetch detected`);
    }
  }

  const criticalRoutes: Array<[string, string]> = [
    ["app/api/contacts-storage/route.ts", "authorize"],
    ["app/api/test-email/route.ts", "authorize"],
  ];
  for (const [file, required] of criticalRoutes) {
    const source = await fs.readFile(file, "utf8");
    if (!source.includes(required)) failures.push(`${file}: ${required} guard missing`);
  }

  const middleware = await fs.readFile("middleware.ts", "utf8");
  const nextConfig = await fs.readFile("next.config.js", "utf8");
  if (!middleware.includes('response.headers.set("Content-Security-Policy"')) {
    failures.push("middleware.ts: enforced Content-Security-Policy missing");
  }
  if (!middleware.includes("'nonce-${nonce}'") || !middleware.includes("'strict-dynamic'")) {
    failures.push("middleware.ts: nonce/strict-dynamic script policy missing");
  }
  if (middleware.includes("NODE_ENV === \"production\" ? \" 'unsafe-eval'")) {
    failures.push("middleware.ts: unsafe-eval enabled in production");
  }
  if (nextConfig.includes("Content-Security-Policy-Report-Only")) {
    failures.push("next.config.js: report-only CSP still configured");
  }

  const providerCallSites = [
    "lib/sales/targets/pipeline.ts",
    "lib/sales/targets/catalog/runner.ts",
  ];
  for (const file of providerCallSites) {
    const source = await fs.readFile(file, "utf8");
    if (/provider\.discover\s*\(/.test(source)) {
      failures.push(`${file}: provider call bypasses controlled execution boundary`);
    }
  }

  if (failures.length) {
    throw new Error(failures.join("\n"));
  }
  console.log("OK: outbound fetch and critical utility route guards present");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

