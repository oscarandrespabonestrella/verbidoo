/// <reference types="node" />
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Fills public/sw.js's PRECACHE list and VERSION after a build: the page, the JS/CSS chunks, the Latin text fonts,
 * the mascot images and icons. VERSION is a hash of that list's contents, so each deploy that changes any of it
 * gets a fresh shell cache and the old one is dropped.
 */
function serviceWorker(): Plugin {
  let outDir = 'dist', publicDir = 'public'
  return {
    name: 'verbidoo-sw',
    apply: 'build',
    configResolved(c) { outDir = c.build.outDir; publicDir = c.publicDir },
    writeBundle(_, bundle) {
      const built = Object.entries(bundle).filter(([f, out]) => f.startsWith('assets/') &&
        !(out.type === 'chunk' && out.facadeModuleId?.includes('node_modules')) && // Supabase: only cloud users load it, and it needs the network anyway
        (/\.(js|css)$/.test(f) || (/\.woff2$/.test(f) && /latin/.test(f)))) // skip font subsets the app never uses (hebrew…)
        .map(([f]) => f)
      const fromPublic = [
        ...readdirSync(join(publicDir, 'img')).map((f) => `img/${f}`),
        'icons/favicon.png', 'icons/icon-192.png', 'manifest.webmanifest',
      ]
      const hash = createHash('sha256').update(readFileSync(join(outDir, 'index.html')))
      for (const f of built) hash.update(f)
      for (const f of fromPublic) hash.update(readFileSync(join(publicDir, f)))
      const urls = ['/', ...[...built, ...fromPublic].map((f) => `/${f}`)]
      const sw = join(outDir, 'sw.js')
      writeFileSync(sw, readFileSync(sw, 'utf8')
        .replace(`/*VERSION*/'dev'`, JSON.stringify(hash.digest('hex').slice(0, 12)))
        .replace('/*PRECACHE*/[]', JSON.stringify(urls)))
    },
  }
}

export default defineConfig({ plugins: [react(), tailwindcss(), serviceWorker()], server: { host: true } }) // host: reachable from phones on the LAN
