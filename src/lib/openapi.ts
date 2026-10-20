/**
 * Loads the Vandelay OpenAPI specs and turns their schemas into Ajv validators.
 *
 * The specs in vandelay-openapi/ are the contract. The server validates request bodies against
 * them at runtime, and the test suite validates every response against them in strict mode
 * (undeclared properties are rejected) so drift from the contract is caught immediately.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import Ajv, { type ValidateFunction, type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

export type ApiName = 'customers' | 'policies' | 'claims' | 'payments' | 'vendors';

export const SPEC_FILES: Record<ApiName, string> = {
  customers: 'customer-api.yaml',
  policies: 'policy-api.yaml',
  claims: 'claims-api.yaml',
  payments: 'payments-api.yaml',
  vendors: 'vendors-api.yaml',
};

export const SPEC_DIR = process.env.SPEC_DIR ?? join(import.meta.dir, '..', '..', 'vandelay-openapi');

const docs = new Map<ApiName, any>();

export function spec(api: ApiName): any {
  let doc = docs.get(api);
  if (!doc) {
    doc = parse(readFileSync(join(SPEC_DIR, SPEC_FILES[api]), 'utf8'));
    docs.set(api, doc);
  }
  return doc;
}

export function specText(api: ApiName): string {
  return readFileSync(join(SPEC_DIR, SPEC_FILES[api]), 'utf8');
}

/**
 * The path prefix shared by every path in the spec, e.g. `/claims/v1`. Spec paths carry their own prefix
 * (and `servers` are host-only) so a Postman collection generated from a spec works with a single host-only
 * `baseUrl` environment variable.
 */
export function basePath(api: ApiName): string {
  const prefixes = new Set(Object.keys(spec(api).paths).map((p) => p.split('/').slice(0, 3).join('/')));
  if (prefixes.size !== 1) throw new Error(`${api} spec paths must share one prefix, found: ${[...prefixes].join(', ')}`);
  return [...prefixes][0];
}

const DROP_KEYS = new Set(['example', 'examples', 'xml', 'externalDocs', 'deprecated', 'discriminator', 'readOnly', 'writeOnly']);

function resolvePointer(doc: any, ref: string): any {
  if (!ref.startsWith('#/')) throw new Error(`Unsupported $ref ${ref}`);
  return ref
    .slice(2)
    .split('/')
    .map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce((node, key) => node?.[key], doc);
}

/**
 * Converts an OpenAPI 3.0 schema into plain JSON Schema: dereferences `$ref`, flattens object
 * `allOf`, and maps `nullable`. With `strict`, objects reject properties the spec does not declare.
 */
export function toJsonSchema(node: any, doc: any, strict: boolean): any {
  if (Array.isArray(node)) return node.map((n) => toJsonSchema(n, doc, strict));
  if (!node || typeof node !== 'object') return node;
  if (node.$ref) return toJsonSchema(resolvePointer(doc, node.$ref), doc, strict);

  let out: any = {};
  for (const [k, v] of Object.entries(node)) {
    if (DROP_KEYS.has(k) || k === 'nullable') continue;
    if (k === 'properties') {
      out.properties = Object.fromEntries(Object.entries(v as object).map(([p, s]) => [p, toJsonSchema(s, doc, strict)]));
    } else if (['items', 'additionalProperties', 'not'].includes(k) || ['allOf', 'anyOf', 'oneOf'].includes(k)) {
      out[k] = toJsonSchema(v, doc, strict);
    } else {
      out[k] = v;
    }
  }

  if (out.allOf) {
    const parts: any[] = out.allOf;
    if (parts.every((p) => p.type === 'object' || p.properties)) {
      const merged: any = { type: 'object', properties: {}, required: [] as string[] };
      for (const p of parts) {
        Object.assign(merged.properties, p.properties ?? {});
        merged.required.push(...(p.required ?? []));
      }
      if (!merged.required.length) delete merged.required;
      delete out.allOf;
      out = { ...out, ...merged };
    }
  }

  if (strict && (out.type === 'object' || out.properties) && out.additionalProperties === undefined) {
    out.additionalProperties = false;
  }

  if (node.nullable) {
    if (out.type) {
      out.type = [out.type, 'null'];
      if (out.enum) out.enum = [...out.enum, null];
    } else {
      out = { anyOf: [out, { type: 'null' }] };
    }
  }
  return out;
}

function makeAjv() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  for (const f of ['double', 'float', 'int32', 'int64']) ajv.addFormat(f, true);
  return ajv;
}

const ajvLenient = makeAjv();
const ajvStrict = makeAjv();

export interface Operation {
  api: ApiName;
  path: string;
  method: string;
  operationId: string;
  op: any;
  pathItem: any;
}

export function operations(api: ApiName): Operation[] {
  const doc = spec(api);
  const ops: Operation[] = [];
  for (const [path, pathItem] of Object.entries<any>(doc.paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const op = pathItem[method];
      if (op) ops.push({ api, path, method, operationId: op.operationId, op, pathItem });
    }
  }
  return ops;
}

export function operation(api: ApiName, operationId: string): Operation {
  const found = operations(api).find((o) => o.operationId === operationId);
  if (!found) throw new Error(`Unknown operation ${api}.${operationId}`);
  return found;
}

const requestValidators = new Map<string, ValidateFunction>();

/** Validator for the JSON request body of an operation (lenient: unknown properties are ignored). */
export function requestBodyValidator(api: ApiName, operationId: string): ValidateFunction {
  const key = `${api}.${operationId}`;
  let v = requestValidators.get(key);
  if (!v) {
    const { op } = operation(api, operationId);
    const schema = op.requestBody?.content?.['application/json']?.schema;
    if (!schema) throw new Error(`${key} has no JSON request body`);
    v = ajvLenient.compile(toJsonSchema(schema, spec(api), false));
    requestValidators.set(key, v);
  }
  return v;
}

/** JSON Schema (strict) for a component schema, e.g. `componentSchema('claims', 'Claim')`. */
export function componentSchema(api: ApiName, name: string, strict = true): any {
  return toJsonSchema(spec(api).components.schemas[name], spec(api), strict);
}

/** Resolves a response object (following `$ref`) for an operation + status code. */
export function responseFor(api: ApiName, operationId: string, status: number | string): any | undefined {
  const { op } = operation(api, operationId);
  const r = op.responses?.[String(status)];
  if (!r) return undefined;
  return r.$ref ? resolvePointer(spec(api), r.$ref) : r;
}

const responseValidators = new Map<string, ValidateFunction | null>();

/** Strict validator for a documented response body, or null if the response has no body. */
export function responseValidator(api: ApiName, operationId: string, status: number, contentType: string): ValidateFunction | null {
  const key = `${api}.${operationId}.${status}.${contentType}`;
  if (!responseValidators.has(key)) {
    const r = responseFor(api, operationId, status);
    const schema = r?.content?.[contentType]?.schema;
    responseValidators.set(key, schema ? ajvStrict.compile(toJsonSchema(schema, spec(api), true)) : null);
  }
  return responseValidators.get(key)!;
}

export function formatAjvErrors(errors: ErrorObject[] | null | undefined): { field: string; message: string }[] {
  if (!errors) return [];
  const out: { field: string; message: string }[] = [];
  const seen = new Set<string>();
  for (const e of errors) {
    let field = e.instancePath.replace(/^\//, '').replace(/\//g, '.');
    let message = e.message ?? 'is invalid';
    if (e.keyword === 'required') {
      field = field ? `${field}.${e.params.missingProperty}` : e.params.missingProperty;
      message = 'is required';
    } else if (e.keyword === 'enum') {
      message = `must be one of: ${(e.params.allowedValues as unknown[]).join(', ')}`;
    } else if (e.keyword === 'minProperties') {
      message = 'must contain at least one property';
    }
    const k = `${field}|${message}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ field: field || 'body', message });
    }
  }
  return out;
}
