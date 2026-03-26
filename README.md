# mcp-conformance

Protocol-first conformance testing for MCP (Model Context Protocol) servers.

> **Status:** Proof of concept for [GSoC 2026 — API Dash MCP Testing](https://github.com/foss42/apidash/pull/1476)

## What it does

Connects to any MCP server via stdio, runs a suite of conformance tests, and reports pass/fail results. Designed for CI pipelines (exit code 1 on failure) and interactive use (colored terminal output).

[![asciicast](https://asciinema.org/a/Ifkx2TysVgMTVwcA.svg)](https://asciinema.org/a/Ifkx2TysVgMTVwcA)

```
$ npx tsx src/cli.ts --server "npx tsx fixtures/test-server.ts"

mcp-conformance v0.1.0
Testing: npx tsx fixtures/test-server.ts

Protocol
  ✓ initialize returns valid result (355ms)
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
  ✓ tools/call to each discovered tool succeeds (0ms)
  ✓ tool content items have text field (0ms)

Edge Cases
  ✓ unknown method returns error code (0ms)
  ✓ duplicate initialize is idempotent (0ms)
  ✓ concurrent tool calls resolve independently (0ms)
  ✓ tools/call with extra params does not crash (0ms)
  ✓ tools/call with empty arguments object (0ms)
  ✓ JSON-RPC response has correct version field (0ms)
  ✓ error response includes message field (0ms)

19 passed (0.4s)
```

## Architecture

```
src/
├── transport/
│   └── stdio.ts          # StdioTransport adapter (spawn + JSON-RPC over stdin/stdout)
├── client.ts             # MCPClient (initialize, tools/list, tools/call, sendRaw)
├── assertions.ts         # Composable assertion functions
├── suite.ts              # Conformance test suite (19 tests across 5 categories)
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
| Execution | 5 | `tools/call` success, unknown tool error (-32601), typed content, all-tools iteration, text field validation |
| Edge Cases | 7 | Unknown method error, duplicate init idempotency, concurrent calls, extra params, empty args, JSON-RPC version, error message format |

## Running

```bash
npm install
npx tsx src/cli.ts --server "npx tsx fixtures/test-server.ts"
```

## License

MIT
