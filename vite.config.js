import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './src/DaisyUITreeView.js', // Path to your source file
      name: 'DaisyUITreeView', // Global variable name for the library
      fileName: (format) => `daisyuitreeview.${format}.js`, // Output file name with .js extension
      formats: ['umd'], // Universal Module Definition for browser compatibility
    },
    rollupOptions: {
      output: {
        globals: {
          // Add any external dependencies here if needed
        },
      },
    },
  },
});