import fg from "fast-glob";

async function main(): Promise<void> {
  const files = await fg("tests/sales/*.test.ts", { absolute: true, onlyFiles: true });
  for (const file of files.sort()) {
    await import(file);
  }
  console.log(`OK: ${files.length} sales test files passed`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

