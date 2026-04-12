import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    hookTimeout: 60000,
    pool: 'forks',
    forks: {
      singleFork: true,
    },
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
    server: {
      deps: {
        inline: ['payload-auth'],
      },
    },
  },
})
