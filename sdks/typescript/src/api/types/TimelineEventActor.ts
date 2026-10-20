import * as core from '../../core';

export interface TimelineEventActor {
  type?: string | undefined;
  id?: string | undefined;
}

/**
 * Cast schema for the TimelineEventActor model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const timelineEventActor = core.cast.identity<TimelineEventActor>();

/**
 * Cast schema for mapping API responses to the TimelineEventActor application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const timelineEventActorResponse = core.cast.object((raw: any): any => {
  if (raw === null || raw === undefined) {
    return raw;
  }
  const __declaredKeys = new Set<string>(['type', 'id']);
  const __extras: { [key: string]: unknown } = {};
  for (const __key of globalThis.Object.keys(raw as object)) {
    if (!__declaredKeys.has(__key)) {
      __extras[__key] = (raw as { [key: string]: unknown })[__key];
    }
  }
  return { ...__extras, type: raw['type'], id: raw['id'] };
}, []);

/**
 * Cast schema for mapping the TimelineEventActor application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const timelineEventActorRequest = core.cast.object((raw: any): any => {
  if (raw === null || raw === undefined) {
    return raw;
  }
  return { type: raw['type'], id: raw['id'] };
}, []);
