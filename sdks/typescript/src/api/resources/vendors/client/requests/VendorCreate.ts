import { VendorType, vendorType } from '../../../../types/VendorType';
import { Address, address } from '../../../../types/Address';

export interface VendorCreate {
  'Idempotency-Key'?: string;
  name: string;
  type: VendorType;
  taxId?: string;
  phone: string;
  email: string;
  address: Address;
  serviceAreaPostalCodes?: string[];
  inNetwork?: boolean;
}
