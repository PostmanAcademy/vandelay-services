import { VendorType, vendorType } from '../../../../types/VendorType';

export interface ListVendorsRequest {
  type?: VendorType;
  postalCode?: string;
  radiusMiles?: number;
  inNetwork?: boolean;
  limit?: number;
  cursor?: string;
}
