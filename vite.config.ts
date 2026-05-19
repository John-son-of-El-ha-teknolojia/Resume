import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  optimizeDeps: {
    exclude: [
      'pdfEditor/PdfEditorModule',
      'coverLetter/CoverLetterModule'
    ],
  },
  ssr: {
    noExternal: [
      'pdfEditor/PdfEditorModule',
      'coverLetter/CoverLetterModule'
    ],
  },
  server: {
    port: 4000,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
});
