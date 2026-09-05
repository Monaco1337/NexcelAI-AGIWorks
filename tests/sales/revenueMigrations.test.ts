import { MIGRATIONS } from "../../lib/db/migrations";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

const ids = MIGRATIONS.map((migration) => migration.id);
assert(new Set(ids).size === ids.length, "migration IDs must be unique");
assert(
  ids.every((id, index) => index === 0 || id > ids[index - 1]),
  `migration IDs must be ordered: ${ids.join(", ")}`,
);
assert(
  ["0016", "0017", "0018", "0019", "0020", "0021", "0022", "0023", "0024", "0025"]
    .every((id) => ids.includes(id)),
  "revenue intelligence migrations 0016-0025 registered",
);
console.log("OK: revenue intelligence migration registry");

