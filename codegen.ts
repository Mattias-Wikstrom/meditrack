import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/api/graphql/typeDefs.ts',
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
  },
};

export default config;
