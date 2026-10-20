import * as core from '../../core';

export const PreferencesContactMethod = {
  Sms: 'sms',
  Email: 'email',
  Phone: 'phone',
  App: 'app',
} as const;

export type PreferencesContactMethod =
  (typeof PreferencesContactMethod)[keyof typeof PreferencesContactMethod];

export const preferencesContactMethod = core.cast.identity<PreferencesContactMethod>();
