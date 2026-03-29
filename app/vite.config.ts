import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      babel: {
        plugins:
          mode === 'development'
            ? [
                [
                  'babel-plugin-styled-components',
                  {
                    displayName: true,
                    fileName: true,
                  },
                ],
              ]
            : [],
      },
    }),
  ],
  server: {
    host: true,
    port: 5178,
  },
}));
