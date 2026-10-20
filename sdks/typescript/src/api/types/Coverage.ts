import * as core from '../../core';
import { Money, money, moneyRequest, moneyResponse } from './Money';

export interface Coverage {
  code: string;
  name: string;
  limit?: Money | undefined;
  deductible?: Money | undefined;
  dailyLimit?: Money | undefined;
}

/**
 * Cast schema for the Coverage model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const coverage = core.cast.identity<Coverage>();

/**
 * Cast schema for mapping API responses to the Coverage application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const coverageResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['code', 'name', 'limit', 'deductible', 'dailyLimit']);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      code: raw['code'],
      name: raw['name'],
      limit: raw['limit'] == null ? raw['limit'] : moneyResponse.parse(raw['limit']),
      deductible:
        raw['deductible'] == null ? raw['deductible'] : moneyResponse.parse(raw['deductible']),
      dailyLimit:
        raw['dailyLimit'] == null ? raw['dailyLimit'] : moneyResponse.parse(raw['dailyLimit']),
    };
  },
  ['code', 'name'],
);

/**
 * Cast schema for mapping the Coverage application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const coverageRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      code: raw['code'],
      name: raw['name'],
      limit: raw['limit'] == null ? raw['limit'] : moneyRequest.parse(raw['limit']),
      deductible:
        raw['deductible'] == null ? raw['deductible'] : moneyRequest.parse(raw['deductible']),
      dailyLimit:
        raw['dailyLimit'] == null ? raw['dailyLimit'] : moneyRequest.parse(raw['dailyLimit']),
    };
  },
  ['code', 'name'],
);
