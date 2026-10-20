import * as core from '../../core';

export const PaymentType = {
  Settlement: 'settlement',
  VendorInvoice: 'vendor_invoice',
  RentalReimbursement: 'rental_reimbursement',
  PremiumRefund: 'premium_refund',
} as const;

export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];

export const paymentType = core.cast.identity<PaymentType>();
