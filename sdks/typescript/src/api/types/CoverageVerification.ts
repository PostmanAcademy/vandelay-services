import * as core from '../../core';
import { Coverage, coverage, coverageRequest, coverageResponse } from './Coverage';
import {
  CoverageVerificationReasonsItem,
  coverageVerificationReasonsItem,
  coverageVerificationReasonsItemRequest,
  coverageVerificationReasonsItemResponse,
} from './CoverageVerificationReasonsItem';
import { CoverageVerificationReasons } from './CoverageVerificationReasons';

export interface CoverageVerification {
  covered: boolean;
  policyId: string;
  lossDate: string;
  coverage?: Coverage | undefined;
  reasons?: CoverageVerificationReasonsItem[] | undefined;
  verifiedAt: string;
}

export namespace CoverageVerification {
  export type Reasons = CoverageVerificationReasons;
  export namespace Reasons {
    export type Item = CoverageVerificationReasonsItem;
  }
}

/**
 * Cast schema for the CoverageVerification model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const coverageVerification = core.cast.identity<CoverageVerification>();

/**
 * Cast schema for mapping API responses to the CoverageVerification application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const coverageVerificationResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'covered',
      'policyId',
      'lossDate',
      'coverage',
      'reasons',
      'verifiedAt',
    ]);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      covered: raw['covered'],
      policyId: raw['policyId'],
      lossDate: raw['lossDate'],
      coverage: raw['coverage'] == null ? raw['coverage'] : coverageResponse.parse(raw['coverage']),
      reasons: Array.isArray(raw['reasons'])
        ? (raw['reasons'] as any[]).map((v: any) =>
            v == null ? v : coverageVerificationReasonsItemResponse.parse(v),
          )
        : (raw['reasons'] as any),
      verifiedAt: raw['verifiedAt'],
    };
  },
  ['covered', 'policyId', 'lossDate', 'verifiedAt'],
);

/**
 * Cast schema for mapping the CoverageVerification application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const coverageVerificationRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      covered: raw['covered'],
      policyId: raw['policyId'],
      lossDate: raw['lossDate'],
      coverage: raw['coverage'] == null ? raw['coverage'] : coverageRequest.parse(raw['coverage']),
      reasons: Array.isArray(raw['reasons'])
        ? (raw['reasons'] as any[]).map((v: any) =>
            v == null ? v : coverageVerificationReasonsItemRequest.parse(v),
          )
        : (raw['reasons'] as any),
      verifiedAt: raw['verifiedAt'],
    };
  },
  ['covered', 'policyId', 'lossDate', 'verifiedAt'],
);
