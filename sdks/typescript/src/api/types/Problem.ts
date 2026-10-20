import * as core from '../../core';
import {
  ProblemErrorsItem,
  problemErrorsItem,
  problemErrorsItemRequest,
  problemErrorsItemResponse,
} from './ProblemErrorsItem';
import { ProblemErrors } from './ProblemErrors';

export const problem = core.cast.identity<Problem>();

export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  errors?: ProblemErrorsItem[];
  traceId?: string;
}

export const problemResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'type',
      'title',
      'status',
      'detail',
      'errors',
      'traceId',
    ]);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      type: raw['type'],
      title: raw['title'],
      status: raw['status'],
      detail: raw['detail'],
      errors: Array.isArray(raw['errors'])
        ? (raw['errors'] as any[]).map((v: any) =>
            v == null ? v : problemErrorsItemResponse.parse(v),
          )
        : (raw['errors'] as any),
      traceId: raw['traceId'],
    };
  },
  ['type', 'title', 'status'],
);

export const problemRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      type: raw['type'],
      title: raw['title'],
      status: raw['status'],
      detail: raw['detail'],
      errors: Array.isArray(raw['errors'])
        ? (raw['errors'] as any[]).map((v: any) =>
            v == null ? v : problemErrorsItemRequest.parse(v),
          )
        : (raw['errors'] as any),
      traceId: raw['traceId'],
    };
  },
  ['type', 'title', 'status'],
);

export namespace Problem {
  export type Errors = ProblemErrors;
  export namespace Errors {
    export type Item = ProblemErrorsItem;
  }
}
