import * as core from '../../../../core';

export const PaymentCreateType = {
  Settlement: 'settlement',
  VendorInvoice: 'vendor_invoice',
  RentalReimbursement: 'rental_reimbursement',
  PremiumRefund: 'premium_refund',
} as const;

export type PaymentCreateType = (typeof PaymentCreateType)[keyof typeof PaymentCreateType];

export const paymentCreateType = core.cast.identity<PaymentCreateType>();
