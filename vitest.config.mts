import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    watch: false,
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**'],
      exclude: ['**/node_modules/**', '**/dist/**', 'src/**/interface.ts']
    },
    testTimeout: 8000
  }
})
