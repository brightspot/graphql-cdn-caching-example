import { existsSync } from 'node:fs';

import type { CodegenConfig } from '@graphql-codegen/cli';

// Shares VITE_SITE_URL with the app, so introspection sees the same site's schema.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const schemaUrl = process.env.GRAPHQL_SCHEMA_URL ?? 'http://localhost/delivery/graphql';
const headers: Record<string, string> = process.env.VITE_SITE_URL ? { 'X-Site': process.env.VITE_SITE_URL } : {};

const config: CodegenConfig = {
  schema: [{ [schemaUrl]: { headers } }],
  documents: ['src/**/*.{ts,tsx}', '!src/gql/**/*'],
  generates: {
    'src/gql/': {
      preset: 'client',
      presetConfig: { fragmentMasking: false },
      config: { useTypeImports: true },
    },
  },
};

export default config;
