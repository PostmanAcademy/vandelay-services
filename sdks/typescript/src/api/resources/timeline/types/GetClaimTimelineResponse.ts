import * as core from '../../../../core';
import {
  TimelineEvent,
  timelineEvent,
  timelineEventRequest,
  timelineEventResponse,
} from '../../../types/TimelineEvent';

export interface GetClaimTimelineResponse {
  data: TimelineEvent[];
}

/**
 * Cast schema for the GetClaimTimelineResponse model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const getClaimTimelineResponse = core.cast.identity<GetClaimTimelineResponse>();

/**
 * Cast schema for mapping API responses to the GetClaimTimelineResponse application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const getClaimTimelineResponseResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>(['data']);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      data: Array.isArray(raw['data'])
        ? (raw['data'] as any[]).map((v: any) => (v == null ? v : timelineEventResponse.parse(v)))
        : (raw['data'] as any),
    };
  },
  ['data'],
);

/**
 * Cast schema for mapping the GetClaimTimelineResponse application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const getClaimTimelineResponseRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      data: Array.isArray(raw['data'])
        ? (raw['data'] as any[]).map((v: any) => (v == null ? v : timelineEventRequest.parse(v)))
        : (raw['data'] as any),
    };
  },
  ['data'],
);
