import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/api/graphql/typeDefs.ts',
  hooks: {
    afterAllFileWrite: ['tsx scripts/guard-gql-fallback.ts'],
  },
  generates: {
    'apps/nurse/src/gql/': {
      preset: 'client',
      presetConfig: { fragmentMasking: false },
      documents: 'apps/nurse/src/**/*.{ts,tsx}',
    },
    'apps/pharmacist/src/gql/': {
      preset: 'client',
      presetConfig: { fragmentMasking: false },
      documents: 'apps/pharmacist/src/**/*.{ts,tsx}',
    },
    'apps/admin/src/gql/': {
      preset: 'client',
      presetConfig: { fragmentMasking: false },
      documents: 'apps/admin/src/**/*.{ts,tsx}',
    },
  },
};

export default config;
