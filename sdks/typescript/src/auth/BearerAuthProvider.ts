import * as core from '../core';
import { PostmanCusteduApiError } from '../errors';

const TOKEN_PARAM = 'token' as const;

export class BearerAuthProvider implements core.AuthProvider {
  private readonly options: BearerAuthProvider.Options;

  constructor(options: BearerAuthProvider.Options) {
    this.options = options;
  }

  public static canCreate(options: Partial<BearerAuthProvider.Options>): boolean {
    return options?.[TOKEN_PARAM] != null;
  }

  public async getAuthRequest(
    _args: { endpointMetadata?: core.EndpointMetadata } = {},
  ): Promise<core.AuthRequest> {
    const token = await core.Supplier.get(this.options[TOKEN_PARAM]);
    if (token == null) {
      throw new PostmanCusteduApiError({
        message: BearerAuthProvider.AUTH_CONFIG_ERROR_MESSAGE,
      });
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  }
}

export namespace BearerAuthProvider {
  export const AUTH_CONFIG_ERROR_MESSAGE: string =
    `Please provide '${TOKEN_PARAM}' when initializing the client` as const;
  export type Options = AuthOptions;
  export type AuthOptions = { [TOKEN_PARAM]?: core.Supplier<string> | undefined };

  export function createInstance(options: Options): core.AuthProvider {
    return new BearerAuthProvider(options);
  }
}
