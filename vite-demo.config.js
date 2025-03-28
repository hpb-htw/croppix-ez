import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    root: "./demo",
    base:"./",
    mode: "production",
    build: {
        outDir: "../dist-demo",
        emptyOutDir: true
    }
})
