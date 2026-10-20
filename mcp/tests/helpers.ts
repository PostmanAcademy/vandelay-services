import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export const MCP_URL = process.env.MCP_URL ?? 'http://localhost:8090/mcp';
export const API_URL = process.env.VANDELAY_API_URL ?? 'http://localhost:8080';

export const TOKENS = {
  agent: process.env.API_TOKEN_AGENT!,
  adjuster: process.env.API_TOKEN_ADJUSTER!,
  supervisor: process.env.API_TOKEN_SUPERVISOR!,
  customer: process.env.API_TOKEN_CUSTOMER!,
};

export type Persona = keyof typeof TOKENS;

export async function connect(persona: Persona, headers: Record<string, string> = {}) {
  const client = new Client({ name: `test-${persona}`, version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(MCP_URL), { requestInit: { headers: { Authorization: `Bearer ${TOKENS[persona]}`, ...headers } } }));
  return client;
}

export type Tool = (name: string, args?: Record<string, unknown>) => Promise<{ isError: boolean; data: any }>;

export const caller = (client: Client): Tool => async (name, args = {}) => {
  const r: any = await client.callTool({ name, arguments: args });
  return { isError: !!r.isError, data: r.structuredContent ?? JSON.parse(r.content[0].text) };
};

export async function resetDb() {
  const r = await fetch(`${API_URL}/_admin/reset`, { method: 'POST', headers: { 'X-Admin-Token': process.env.ADMIN_TOKEN! } });
  if (!r.ok) throw new Error(`reset failed: ${r.status}`);
}
