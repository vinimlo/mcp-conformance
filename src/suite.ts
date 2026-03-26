import { MCPClient, ToolDefinition } from "./client.js";
import {
  AssertionResult,
  runAssertion,
  assert,
  assertType,
  assertHasKey,
  assertErrorCode,
} from "./assertions.js";

export async function runConformanceSuite(client: MCPClient): Promise<AssertionResult[]> {
  const results: AssertionResult[] = [];
  let tools: ToolDefinition[] = [];

  // ── Protocol Tests ──

  results.push(
    await runAssertion("initialize returns valid result", "Protocol", async () => {
      const result = await client.initialize();
      assertHasKey(result, "protocolVersion", "InitializeResult");
      assertHasKey(result, "capabilities", "InitializeResult");
      assertHasKey(result, "serverInfo", "InitializeResult");
    })
  );

  results.push(
    await runAssertion("server reports protocol version", "Protocol", async () => {
      const result = await client.initialize();
      assertType(result.protocolVersion, "string", "protocolVersion");
      assert(result.protocolVersion.length > 0, "protocolVersion is empty");
    })
  );

  results.push(
    await runAssertion("server reports name and version", "Protocol", async () => {
      const result = await client.initialize();
      assertHasKey(result.serverInfo, "name", "serverInfo");
      assertHasKey(result.serverInfo, "version", "serverInfo");
      assertType(result.serverInfo.name, "string", "serverInfo.name");
    })
  );

  results.push(
    await runAssertion("capabilities is an object", "Protocol", async () => {
      const result = await client.initialize();
      assertType(result.capabilities, "object", "capabilities");
    })
  );

  // ── Discovery Tests ──

  results.push(
    await runAssertion("tools/list returns valid array", "Discovery", async () => {
      tools = await client.listTools();
      assertType(tools, "array", "tools");
      assert(tools.length > 0, "Server returned 0 tools");
    })
  );

  // ── Schema Validation Tests ──

  results.push(
    await runAssertion("all tools have name and description", "Schema", async () => {
      if (tools.length === 0) tools = await client.listTools();
      for (const tool of tools) {
        assertHasKey(tool, "name", `tool`);
        assertType(tool.name, "string", `tool.name`);
        assert(tool.name.length > 0, `Tool has empty name`);
      }
    })
  );

  results.push(
    await runAssertion("all tools have valid inputSchema", "Schema", async () => {
      if (tools.length === 0) tools = await client.listTools();
      for (const tool of tools) {
        if (tool.inputSchema) {
          assertType(tool.inputSchema, "object", `${tool.name}.inputSchema`);
          assertHasKey(tool.inputSchema, "type", `${tool.name}.inputSchema`);
          assert(
            tool.inputSchema.type === "object",
            `${tool.name}.inputSchema.type should be "object", got "${tool.inputSchema.type}"`
          );
        }
      }
    })
  );

  // ── Tool Execution Tests ──

  results.push(
    await runAssertion("tools/call with valid params succeeds", "Execution", async () => {
      if (tools.length === 0) tools = await client.listTools();
      const tool = tools[0];

      // Build minimal valid args from schema
      const args: Record<string, unknown> = {};
      if (tool.inputSchema?.properties) {
        for (const [key, schema] of Object.entries(tool.inputSchema.properties)) {
          const s = schema as { type?: string };
          if (s.type === "string") args[key] = "test";
          else if (s.type === "number") args[key] = 1;
          else if (s.type === "boolean") args[key] = true;
        }
      }

      const result = await client.callTool(tool.name, args);
      assertHasKey(result, "content", "ToolCallResult");
      assertType(result.content, "array", "ToolCallResult.content");
    })
  );

  results.push(
    await runAssertion("tools/call with unknown tool returns error", "Execution", async () => {
      try {
        await client.callTool("__nonexistent_tool_12345__");
        assert(false, "Expected error for unknown tool, but call succeeded");
      } catch (err) {
        assertErrorCode(err, -32601);
      }
    })
  );

  results.push(
    await runAssertion("tool result contains typed content", "Execution", async () => {
      if (tools.length === 0) tools = await client.listTools();
      const tool = tools[0];
      const args: Record<string, unknown> = {};
      if (tool.inputSchema?.properties) {
        for (const [key, schema] of Object.entries(tool.inputSchema.properties)) {
          const s = schema as { type?: string };
          if (s.type === "string") args[key] = "test";
          else if (s.type === "number") args[key] = 42;
        }
      }

      const result = await client.callTool(tool.name, args);
      assert(result.content.length > 0, "Tool returned empty content array");
      for (const item of result.content) {
        assertHasKey(item, "type", "content item");
        assertType(item.type, "string", "content.type");
      }
    })
  );

  return results;
}
