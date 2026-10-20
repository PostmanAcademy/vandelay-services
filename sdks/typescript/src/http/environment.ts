export const PostmanCusteduApiEnvironment = {
  Production: 'https://api.vandelay-industries.example',
  Staging: 'https://api.staging.vandelay-industries.example',
} as const;

export type PostmanCusteduApiEnvironment =
  (typeof PostmanCusteduApiEnvironment)[keyof typeof PostmanCusteduApiEnvironment];
