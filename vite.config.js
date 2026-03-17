import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages project site base: https://yuhecc.github.io/mu-prototype/
  base: '/mu-prototype/',
  plugins: [react()],
})
