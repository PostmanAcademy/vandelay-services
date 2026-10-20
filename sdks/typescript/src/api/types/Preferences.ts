import * as core from '../../core';
import { PreferencesContactMethod, preferencesContactMethod } from './PreferencesContactMethod';

export interface Preferences {
  contactMethod?: PreferencesContactMethod | undefined;
  language?: string | undefined;
  marketingOptIn?: boolean | undefined;
}

export namespace Preferences {
  export type ContactMethod = PreferencesContactMethod;
  export const ContactMethod = PreferencesContactMethod;
}

/**
 * Cast schema for the Preferences model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const preferences = core.cast.identity<Preferences>();

/**
 * Cast schema for mapping API responses to the Preferences application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const preferencesResponse = core.cast.object((raw: any): any => {
  if (raw === null || raw === undefined) {
    return raw;
  }
  const __declaredKeys = new Set<string>(['contactMethod', 'language', 'marketingOptIn']);
  const __extras: { [key: string]: unknown } = {};
  for (const __key of globalThis.Object.keys(raw as object)) {
    if (!__declaredKeys.has(__key)) {
      __extras[__key] = (raw as { [key: string]: unknown })[__key];
    }
  }
  return {
    ...__extras,
    contactMethod: raw['contactMethod'],
    language: raw['language'],
    marketingOptIn: raw['marketingOptIn'],
  };
}, []);

/**
 * Cast schema for mapping the Preferences application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const preferencesRequest = core.cast.object((raw: any): any => {
  if (raw === null || raw === undefined) {
    return raw;
  }
  return {
    contactMethod: raw['contactMethod'],
    language: raw['language'],
    marketingOptIn: raw['marketingOptIn'],
  };
}, []);
