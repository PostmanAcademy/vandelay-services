import { Supplier } from './utils/supplier';
import { PostmanCusteduApiError } from './errors/throwable-error';

/**
 * A pluggable request-auth override (FSDK-429), matching Fern's own `core.AuthProvider` shape
 * exactly. Implement this to compute auth headers per-request — e.g. refreshing a short-lived
 * token — instead of the SDK's default credential resolution.
 */
export interface AuthRequest {
  headers: Record<string, string>;
}

export interface AuthProvider {
  getAuthRequest(arg?: { endpointMetadata?: Record<string, unknown> }): Promise<AuthRequest>;
}

export function isAuthProvider(value: unknown): value is AuthProvider {
  return (
    typeof value === 'object' &&
    value !== null &&
    'getAuthRequest' in value &&
    typeof (value as { getAuthRequest?: unknown }).getAuthRequest === 'function'
  );
}

/**
 * A credential an operation cannot be called without. As in Fern's own providers, a request that
 * would go out unauthenticated fails here with a message naming the option instead of reaching the
 * server and coming back as a 401.
 */
export function requireCredential<T>(value: T | null | undefined, message: string): T {
  if (value === undefined || value === null) {
    throw new PostmanCusteduApiError({ message });
  }
  return value;
}

/** Disables auth entirely — every request goes out with no auth header at all. */
export class NoOpAuthProvider implements AuthProvider {
  public getAuthRequest(): Promise<AuthRequest> {
    return Promise.resolve({ headers: {} });
  }
}

/** Sends the default bearer-style credential, read lazily on each `getAuthRequest()`. */
export class BearerAuthProvider implements AuthProvider {
  constructor(
    private readonly credential: () => Promise<string | undefined> | string | undefined,
    private readonly prefix: string,
  ) {}

  public async getAuthRequest(): Promise<AuthRequest> {
    const token = await this.credential();
    return { headers: token === undefined ? {} : { Authorization: `${this.prefix} ${token}` } };
  }
}

/**
 * Resolves the provider an access-token-authenticated request authenticates through. In order:
 * `auth` (`false`, a function, an `AuthProvider`, or `{ token }`), then an `authProvider` injected
 * through the client options, then the SDK's own default credential (read lazily, only when
 * nothing earlier applies). A plain-object `auth` only ever supplies this scheme's own credential,
 * not an arbitrary alternate scheme.
 */
export function resolveBearerAuthProvider(
  config:
    | {
        auth?: false | AuthProvider['getAuthRequest'] | AuthProvider | { token?: Supplier<string> };
        authProvider?: AuthProvider;
      }
    | undefined,
  defaultToken: () => Promise<string | undefined> | string | undefined,
  prefix: string,
): AuthProvider {
  const auth = config?.auth;
  if (auth === false) {
    return new NoOpAuthProvider();
  }
  if (typeof auth === 'function') {
    return { getAuthRequest: () => auth() };
  }
  if (isAuthProvider(auth)) {
    return auth;
  }
  if (auth?.token !== undefined) {
    const overrideToken = auth.token;
    return new BearerAuthProvider(() => Supplier.get(overrideToken), prefix);
  }
  if (isAuthProvider(config?.authProvider)) {
    return config.authProvider;
  }
  return new BearerAuthProvider(defaultToken, prefix);
}

/** The header(s) `resolveBearerAuthProvider`'s provider produces for one request. */
export async function resolveAuthHeaders(
  config: Parameters<typeof resolveBearerAuthProvider>[0],
  defaultToken: () => Promise<string | undefined> | string | undefined,
  prefix: string,
): Promise<Record<string, string>> {
  return (await resolveBearerAuthProvider(config, defaultToken, prefix).getAuthRequest()).headers;
}
