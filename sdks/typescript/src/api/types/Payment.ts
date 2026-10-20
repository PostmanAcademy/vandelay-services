import * as core from '../../core';
import { PaymentType, paymentType } from './PaymentType';
import { Payee, payee, payeeRequest, payeeResponse } from './Payee';
import { Money, money, moneyRequest, moneyResponse } from './Money';
import { PaymentStatus, paymentStatus } from './PaymentStatus';
import { PaymentRail, paymentRail } from './PaymentRail';

export interface Payment {
  id: string;
  claimId: string;
  type: PaymentType;
  payee: Payee;
  paymentMethodId?: string | undefined;
  amount: Money;
  status: PaymentStatus;
  method?: PaymentRail | undefined;
  invoiceNumber?: string | undefined;
  memo?: string | undefined;
  createdAt: string;
  completedAt?: string | undefined;
}

export namespace Payment {
  export type Type = PaymentType;
  export const Type = PaymentType;
}

/**
 * Cast schema for the Payment model — a bare identity (see cast.ts): this
 * export is never itself used for wire<->app rename, only referenced by name from other files.
 */
export const payment = core.cast.identity<Payment>();

/**
 * Cast schema for mapping API responses to the Payment application shape.
 * Renames wire keys to idiomatic property names; performs no validation (see cast.ts).
 */
export const paymentResponse = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    const __declaredKeys = new Set<string>([
      'id',
      'claimId',
      'type',
      'payee',
      'paymentMethodId',
      'amount',
      'status',
      'method',
      'invoiceNumber',
      'memo',
      'createdAt',
      'completedAt',
    ]);
    const __extras: { [key: string]: unknown } = {};
    for (const __key of globalThis.Object.keys(raw as object)) {
      if (!__declaredKeys.has(__key)) {
        __extras[__key] = (raw as { [key: string]: unknown })[__key];
      }
    }
    return {
      ...__extras,
      id: raw['id'],
      claimId: raw['claimId'],
      type: raw['type'],
      payee: raw['payee'] == null ? raw['payee'] : payeeResponse.parse(raw['payee']),
      paymentMethodId: raw['paymentMethodId'],
      amount: raw['amount'] == null ? raw['amount'] : moneyResponse.parse(raw['amount']),
      status: raw['status'],
      method: raw['method'],
      invoiceNumber: raw['invoiceNumber'],
      memo: raw['memo'],
      createdAt: raw['createdAt'],
      completedAt: raw['completedAt'],
    };
  },
  ['id', 'claimId', 'type', 'payee', 'amount', 'status', 'createdAt'],
);

/**
 * Cast schema for mapping the Payment application shape to API requests.
 * Renames idiomatic property names back to wire keys; performs no validation (see cast.ts).
 */
export const paymentRequest = core.cast.object(
  (raw: any): any => {
    if (raw === null || raw === undefined) {
      return raw;
    }
    return {
      id: raw['id'],
      claimId: raw['claimId'],
      type: raw['type'],
      payee: raw['payee'] == null ? raw['payee'] : payeeRequest.parse(raw['payee']),
      paymentMethodId: raw['paymentMethodId'],
      amount: raw['amount'] == null ? raw['amount'] : moneyRequest.parse(raw['amount']),
      status: raw['status'],
      method: raw['method'],
      invoiceNumber: raw['invoiceNumber'],
      memo: raw['memo'],
      createdAt: raw['createdAt'],
      completedAt: raw['completedAt'],
    };
  },
  ['id', 'claimId', 'type', 'payee', 'amount', 'status', 'createdAt'],
);
