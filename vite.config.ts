import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // השורה הזו קריטית - היא אומרת ל-Vite שהאתר רץ תחת תיקיית aminach-employees
  base: '/aminach-employees/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
