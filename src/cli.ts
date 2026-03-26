import { StdioTransport } from "./transport/stdio.js";
import { MCPClient } from "./client.js";
import { runConformanceSuite } from "./suite.js";
import { AssertionResult } from "./assertions.js";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";

function parseArgs(): { server: string } {
  const args = process.argv.slice(2);
  const serverIdx = args.indexOf("--server");
  if (serverIdx === -1 || !args[serverIdx + 1]) {
    console.error(`Usage: mcp-conformance --server "command to start MCP server"`);
    process.exit(1);
  }
  return { server: args[serverIdx + 1] };
}

function printResults(results: AssertionResult[]): void {
  const categories = new Map<string, AssertionResult[]>();
  for (const r of results) {
    if (!categories.has(r.category)) categories.set(r.category, []);
    categories.get(r.category)!.push(r);
  }

  console.log();
  for (const [category, tests] of categories) {
    console.log(`${BOLD}${category}${RESET}`);
    for (const t of tests) {
      const icon = t.passed ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
      const time = `${DIM}(${t.durationMs.toFixed(0)}ms)${RESET}`;
      console.log(`  ${icon} ${t.name} ${time}`);
      if (!t.passed && t.error) {
        console.log(`    ${RED}→ ${t.error}${RESET}`);
      }
    }
    console.log();
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  const totalMs = results.reduce((sum, r) => sum + r.durationMs, 0);

  const summary = failed === 0
    ? `${GREEN}${BOLD}${passed} passed${RESET}`
    : `${GREEN}${passed} passed${RESET}, ${RED}${BOLD}${failed} failed${RESET}`;

  console.log(`${summary} ${DIM}(${(totalMs / 1000).toFixed(1)}s)${RESET}`);
}

async function main(): Promise<void> {
  const { server } = parseArgs();

  console.log(`${CYAN}${BOLD}mcp-conformance${RESET} ${DIM}v0.1.0${RESET}`);
  console.log(`${DIM}Testing: ${server}${RESET}`);

  const transport = new StdioTransport(server);

  try {
    await transport.connect();
    const client = new MCPClient(transport);
    const results = await runConformanceSuite(client);
    printResults(results);

    const failed = results.filter((r) => !r.passed).length;
    process.exitCode = failed > 0 ? 1 : 0;
  } catch (err) {
    console.error(`${RED}Fatal error: ${err instanceof Error ? err.message : err}${RESET}`);
    process.exitCode = 1;
  } finally {
    await transport.disconnect();
  }
}

main();
