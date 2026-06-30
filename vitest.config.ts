import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
    test: {
        // Use jsdom for React component testing (available but not required for
        // pure-logic tests). Keep it dom-compatible for future UI tests.
        environment: 'jsdom',
        include: ['utils/**/*.test.ts', 'utils/**/*.test.tsx', 'components/**/*.test.tsx'],
        // Prevent accidental .only commits — blocks when a focused test is left in.
        // Vitest 4.x: allowOnly: false means .only tests are forbidden (skip+error).
        allowOnly: false,
        // Exclude backend tests (Node.js runtime)
        exclude: ['node_modules', 'dist', 'backend'],
    },
});
