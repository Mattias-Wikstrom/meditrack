import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export function createViteConfig(appDir: string) {
  return defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@meditrack/ui': path.resolve(appDir, '../../packages/ui/src'),
        '@meditrack/client': path.resolve(appDir, '../../packages/client/src'),
      },
    },
  });
}
