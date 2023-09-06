
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'

export default defineConfig( () => {
    return {
        build: {
            outDir: 'build',
        },
        plugins: [ react(), svgr() ],
        server: {
            port: 3000
        },

        // Polyfill the Buffer nodejs module for the browser
        optimizeDeps: {
            esbuildOptions: {
                define: {
                    global: 'globalThis'
                },
                plugins: [ NodeGlobalsPolyfillPlugin( { buffer: true } ) ]
            }
        }
    }
} )

