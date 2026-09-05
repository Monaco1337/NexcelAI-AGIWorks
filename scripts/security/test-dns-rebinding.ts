import assert from "node:assert/strict";
import { pinnedConnectionTarget } from "../../lib/sales/targets/security/safeFetch";
import {
  classifyIpString,
  inspectUrlDeep,
} from "../../lib/sales/targets/security/ssrfGuard";

async function main(): Promise<void> {
  let lookups = 0;
  const rebindingResolver = async () => {
    lookups++;
    return lookups === 1
      ? [{ address: "93.184.216.34", family: 4 }]
      : [{ address: "127.0.0.1", family: 4 }];
  };

  const inspection = await inspectUrlDeep(
    "https://rebind-test.example/resource",
    rebindingResolver,
  );
  assert.equal(inspection.ok, true);
  assert.equal(inspection.resolvedIp, "93.184.216.34");
  assert.equal(lookups, 1, "security inspection must resolve exactly once");

  const connection = pinnedConnectionTarget(
    "https://rebind-test.example/resource",
    inspection.resolvedIp!,
  );
  assert.equal(connection.hostname, "93.184.216.34");
  assert.equal(connection.host, "93.184.216.34");
  assert.equal(connection.servername, "rebind-test.example");
  assert.equal(
    classifyIpString((await rebindingResolver())[0].address).public,
    false,
    "the simulated rebound address must be private",
  );
  assert.equal(
    connection.hostname,
    "93.184.216.34",
    "connection target must remain pinned after DNS changes",
  );

  console.log(JSON.stringify({
    passed: true,
    initialResolvedIp: inspection.resolvedIp,
    reboundIp: "127.0.0.1",
    connectedIp: connection.hostname,
    tlsServername: connection.servername,
  }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
