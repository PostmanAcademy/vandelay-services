import { Preferences, preferences } from '../../../../types/Preferences';

export interface ReplaceCustomerPreferencesRequest {
  customerId: string;
  body: Preferences;
}
