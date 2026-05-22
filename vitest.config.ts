import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    server: {
      deps: {
        inline: ['@graphql-tools/schema', '@graphql-tools/merge', '@graphql-tools/utils'],
      },
    },
  },
});
