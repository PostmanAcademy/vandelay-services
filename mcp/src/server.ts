/**
 * Vandelay Claims MCP server.
 *
 * Streamable HTTP, stateless: every request authenticates with a Vandelay persona bearer token, and a fresh MCP server is built
 * for that caller exposing only the tools their role may use. The caller's token is passed through to the Vandelay APIs.
 */
process.env.TZ = 'UTC';

import { Hono } from 'hono';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { API_BASE_URL, APP_ENV, PORT } from './lib/config';
import { authenticate, configuredPersonas, PERSONA_ENV_NAMES, type Principal } from './lib/auth';
import { registerTools } from './lib/kit';
import { customerTools } from './tools/customer';
import { staffTools } from './tools/staff';
import { registerPromptsAndResources } from './prompts';

const ALL_TOOLS = [...customerTools, ...staffTools];
const NAME = 'vandelay-claims';
const VERSION = '1.0.0';

const INSTRUCTIONS = `Vandelay Industries claims assistant. Tools cover the whole claim lifecycle: open (file_claim), manage (status, notes, vendors, payments, decisions), and close (closeout_claim).
Rules: act only within the permissions you have (call whoami if unsure); money-moving and destructive tools preview first and act only with confirm=true; never invent IDs, use list_* and find_* tools; explain outcomes in plain language; never ask for full card or bank account numbers.`;

export function buildServer(p: Principal) {
  const server = new McpServer({ name: NAME, version: VERSION }, { instructions: INSTRUCTIONS });
  registerTools(server, p, ALL_TOOLS);
  registerPromptsAndResources(server, p);
  return server;
}

export const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok', environment: APP_ENV, name: NAME, version: VERSION }));

app.get('/', (c) =>
  c.json({
    name: 'Vandelay Claims MCP Server',
    version: VERSION,
    environment: APP_ENV,
    mcp: '/mcp',
    transport: 'streamable-http (stateless)',
    auth: 'Authorization: Bearer <Vandelay persona token>. Agents add "X-On-Behalf-Of: <customerId>" to act for one customer.',
    tools: ALL_TOOLS.length,
  }),
);

const rpcError = (status: number, code: number, message: string, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify({ jsonrpc: '2.0', error: { code, message }, id: null }), { status, headers: { 'Content-Type': 'application/json', ...headers } });

app.all('/mcp', async (c) => {
  const principal = authenticate(c.req.header('Authorization'));
  if (!principal) return rpcError(401, -32001, 'Bearer token is missing or invalid.', { 'WWW-Authenticate': 'Bearer' });
  if (principal.role === 'agent') {
    const onBehalf = c.req.header('X-On-Behalf-Of')?.trim();
    if (onBehalf) {
      if (!/^cus_[A-Za-z0-9]+$/.test(onBehalf)) return rpcError(400, -32602, 'X-On-Behalf-Of must be a customer ID like cus_01HX9K.');
      principal.customerId = onBehalf;
    }
  }
  if (c.req.method !== 'POST') return rpcError(405, -32000, 'Method not allowed: this server is stateless; use POST.', { Allow: 'POST' });
  const server = buildServer(principal);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(c.req.raw);
});

if (import.meta.main) {
  if (!configuredPersonas.length) {
    console.error(`[auth] No tokens configured. Set at least one of: ${PERSONA_ENV_NAMES.join(', ')}. Refusing to start.`);
    process.exit(1);
  }
  console.log(`[auth] ${configuredPersonas.length} persona token(s) configured: ${configuredPersonas.join(', ')}`);
  console.log(`[server] ${NAME} (${APP_ENV}) on :${PORT}, ${ALL_TOOLS.length} tools, upstream ${API_BASE_URL}`);
}

export default { port: PORT, fetch: app.fetch };
