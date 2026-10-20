import * as core from '../../core';

export interface ProblemErrorsItem {
  field?: string | undefined;
  message?: string | undefined;
}

/**
 * Cast schema for the ProblemErrorsItem model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const problemErrorsItem = core.cast.identity<ProblemErrorsItem>();

/**
 * Cast schema for mapping API responses to the ProblemErrorsItem application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const problemErrorsItemResponse = core.cast.object((raw: any): any => {
  if (raw === null || raw === undefined) {
    return raw;
  }
  const __declaredKeys = new Set<string>(['field', 'message']);
  const __extras: { [key: string]: unknown } = {};
  for (const __key of globalThis.Object.keys(raw as object)) {
    if (!__declaredKeys.has(__key)) {
      __extras[__key] = (raw as { [key: string]: unknown })[__key];
    }
  }
  return { ...__extras, field: raw['field'], message: raw['message'] };
}, []);

/**
 * Cast schema for mapping the ProblemErrorsItem application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const problemErrorsItemRequest = core.cast.object((raw: any): any => {
  if (raw === null || raw === undefined) {
    return raw;
  }
  return { field: raw['field'], message: raw['message'] };
}, []);
