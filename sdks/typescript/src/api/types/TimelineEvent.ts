import * as core from '../../core';
import {
  TimelineEventActor,
  timelineEventActor,
  timelineEventActorRequest,
  timelineEventActorResponse,
} from './TimelineEventActor';

export interface TimelineEvent {
  at: string;
  event: string;
  actor?: TimelineEventActor | undefined;
  summary: string;
}

export namespace TimelineEvent {
  export interface Actor {
    type?: TimelineEventActor['type'];
    id?: TimelineEventActor['id'];
  }
}

/**
 * Cast schema for the TimelineEvent model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const timelineEvent = core.cast.identity<TimelineEvent>();

/**
 * Cast schema for mapping API responses to the TimelineEvent application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const timelineEventResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['at', 'event', 'actor', 'summary']);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      at: raw['at'],
      event: raw['event'],
      actor: raw['actor'] == null ? raw['actor'] : timelineEventActorResponse.parse(raw['actor']),
      summary: raw['summary'],
    };
  },
  ['at', 'event', 'summary'],
);

/**
 * Cast schema for mapping the TimelineEvent application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const timelineEventRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      at: raw['at'],
      event: raw['event'],
      actor: raw['actor'] == null ? raw['actor'] : timelineEventActorRequest.parse(raw['actor']),
      summary: raw['summary'],
    };
  },
  ['at', 'event', 'summary'],
);
