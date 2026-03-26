# mcp-conformance

Protocol-first conformance testing for MCP (Model Context Protocol) servers.

> **Status:** Proof of concept for [GSoC 2026 — API Dash MCP Testing](https://github.com/foss42/apidash/pull/1476)

## What it does

Connects to any MCP server via stdio, runs a suite of conformance tests, and reports pass/fail results. Designed for CI pipelines (exit code 1 on failure) and interactive use (colored terminal output).

```
$ npx tsx src/cli.ts --server "npx tsx fixtures/test-server.ts"

mcp-conformance v0.1.0
Testing: npx tsx fixtures/test-server.ts

Protocol
  ✓ initialize returns valid result (344ms)
  ✓ server reports protocol version (0ms)
  ✓ server reports name and version (0ms)
  ✓ capabilities is an object (0ms)

Discovery
  ✓ tools/list returns valid array (0ms)

Schema
  ✓ all tools have name and description (0ms)
  ✓ all tools have valid inputSchema (0ms)

Execution
  ✓ tools/call with valid params succeeds (0ms)
  ✓ tools/call with unknown tool returns error (0ms)
  ✓ tool result contains typed content (0ms)

10 passed (0.3s)
```

## Architecture

```
src/
├── transport/
│   └── stdio.ts          # StdioTransport adapter (spawn + JSON-RPC over stdin/stdout)
├── client.ts             # MCPClient (initialize, tools/list, tools/call)
├── assertions.ts         # Composable assertion functions
├── suite.ts              # Conformance test suite (10 tests across 4 categories)
└── cli.ts                # CLI entry point with colored output
fixtures/
└── test-server.ts        # Minimal MCP server (3 tools: greet, add, echo)
```

### Key design decisions

- **Transport adapter interface** — `connect()`, `send()`, `disconnect()` abstracts stdio/HTTP/SSE transports behind a common interface
- **Composable assertions** — Each assertion is a standalone function (`assert`, `assertType`, `assertHasKey`, `assertErrorCode`) composable into test cases
- **Protocol-first** — Tests verify MCP spec compliance (JSON-RPC 2.0, error codes, capability negotiation), not just "does it respond"
- **CI-native** — Exit code 0/1 for pass/fail. Output formats (JUnit XML, TAP, JSON) planned for full version.

## Test categories

| Category | Tests | What they verify |
|----------|-------|-----------------|
| Protocol | 4 | `initialize` result structure, protocol version, server info, capabilities |
| Discovery | 1 | `tools/list` returns valid tool array |
| Schema | 2 | Tool definitions have name/description, valid `inputSchema` |
| Execution | 3 | `tools/call` success, unknown tool error (-32601), typed content |

## Running

```bash
npm install
npx tsx src/cli.ts --server "npx tsx fixtures/test-server.ts"
```

## License

MIT
