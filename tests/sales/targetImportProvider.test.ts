import {
  parseControlledImport,
  parseCsv,
} from "../../lib/sales/targets/providers/importProvider";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

const csv = [
  "externalId,name,legalForm,city,website,confidence",
  'm-1,"Müller, Sanitär GmbH",GmbH,Dortmund,https://mueller.example,0.9',
].join("\n");
const rows = parseCsv(csv);
assert(rows[0]?.name === "Müller, Sanitär GmbH", "quoted CSV field");

const parsed = parseControlledImport(csv, "csv", "reviewed-batch-1");
assert(parsed.records.length === 1, "one CSV record parsed");
assert(parsed.stubs[0]?.provider === "controlled_import", "import provenance provider");
assert(parsed.stubs[0]?.providerRawId === "m-1", "stable external id");
assert(
  parsed.stubs[0]?.providerSourceUrl === "import://reviewed-batch-1/m-1",
  "batch lineage retained",
);

const first = parseControlledImport([{ name: "Test GmbH", city: "Unna" }], "json");
const repeated = parseControlledImport([{ name: "Test GmbH", city: "Unna" }], "json");
assert(first.batchId === repeated.batchId, "content-derived batch id is deterministic");

console.log("OK · Controlled import provider");
