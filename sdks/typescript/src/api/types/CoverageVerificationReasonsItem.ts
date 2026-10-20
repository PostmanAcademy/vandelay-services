import * as core from '../../core';

export interface CoverageVerificationReasonsItem {
  code?: string | undefined;
  message?: string | undefined;
}

/**
 * Cast schema for the CoverageVerificationReasonsItem model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const coverageVerificationReasonsItem =
  core.cast.identity<CoverageVerificationReasonsItem>();

/**
 * Cast schema for mapping API responses to the CoverageVerificationReasonsItem application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const coverageVerificationReasonsItemResponse = core.cast.object((raw: any): any => {
  if (raw === null || raw === undefined) {
    return raw;
  }
  const __declaredKeys = new Set<string>(['code', 'message']);
  const __extras: { [key: string]: unknown } = {};
  for (const __key of globalThis.Object.keys(raw as object)) {
    if (!__declaredKeys.has(__key)) {
      __extras[__key] = (raw as { [key: string]: unknown })[__key];
    }
  }
  return { ...__extras, code: raw['code'], message: raw['message'] };
}, []);

/**
 * Cast schema for mapping the CoverageVerificationReasonsItem application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const coverageVerificationReasonsItemRequest = core.cast.object((raw: any): any => {
  if (raw === null || raw === undefined) {
    return raw;
  }
  return { code: raw['code'], message: raw['message'] };
}, []);
