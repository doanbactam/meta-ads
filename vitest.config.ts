import { defineConfig } from 'vitest/config'
import path from 'path'
import { config } from 'dotenv'

// Load test environment variables
config({ path: '.env.test' })

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // setupFiles: ['./tests/setup.ts'], // Temporarily disabled for verification
    env: {
      TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || '',
      FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || 'test_app_id',
      FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || 'test_app_secret',
    },
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['node_modules', 'e2e', '.next', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        '.next/',
        'e2e/',
        'scripts/',
      ],
    },
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
