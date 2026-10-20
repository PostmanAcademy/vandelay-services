import * as core from '../../../../core';
import { PaymentCreateType, paymentCreateType } from './PaymentCreateType';
import { Payee, payee, payeeRequest, payeeResponse } from '../../../types/Payee';
import { Money, money, moneyRequest, moneyResponse } from '../../../types/Money';
import { PaymentCreate } from '../client/requests/PaymentCreate';

export type { PaymentCreate };

/**
 * Cast schema for the PaymentCreate model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const paymentCreate = core.cast.identity<PaymentCreate>();

/**
 * Cast schema for mapping API responses to the PaymentCreate application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const paymentCreateResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'claimId',
      'type',
      'payee',
      'paymentMethodId',
      'amount',
      'invoiceNumber',
      'memo',
    ]);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      claimId: raw['claimId'],
      type: raw['type'],
      payee: raw['payee'] == null ? raw['payee'] : payeeResponse.parse(raw['payee']),
      paymentMethodId: raw['paymentMethodId'],
      amount: raw['amount'] == null ? raw['amount'] : moneyResponse.parse(raw['amount']),
      invoiceNumber: raw['invoiceNumber'],
      memo: raw['memo'],
    };
  },
  ['claimId', 'type', 'payee', 'paymentMethodId', 'amount'],
);

/**
 * Cast schema for mapping the PaymentCreate application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const paymentCreateRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      claimId: raw['claimId'],
      type: raw['type'],
      payee: raw['payee'] == null ? raw['payee'] : payeeRequest.parse(raw['payee']),
      paymentMethodId: raw['paymentMethodId'],
      amount: raw['amount'] == null ? raw['amount'] : moneyRequest.parse(raw['amount']),
      invoiceNumber: raw['invoiceNumber'],
      memo: raw['memo'],
    };
  },
  ['claimId', 'type', 'payee', 'paymentMethodId', 'amount'],
);
