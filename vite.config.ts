import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import brand from './brand.config.json' with { type: 'json' };

// The brand is one setting (brand.config.json). This plugin pushes it into
// index.html, the web app manifest, and the service worker cache name.
function brandAndPwa(): Plugin {
  const manifest = () =>
    JSON.stringify(
      {
        name: brand.name,
        short_name: brand.shortName,
        description: brand.tagline,
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: brand.backgroundColor,
        theme_color: brand.themeColor,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      null,
      2,
    );

  return {
    name: 'brand-and-pwa',
    transformIndexHtml(html) {
      const robots = brand.privateBeta ? 'noindex, nofollow, noarchive' : 'index, follow';
      return html
        .replaceAll('%BRAND_NAME%', brand.name)
        .replaceAll('%BRAND_TAGLINE%', brand.tagline)
        .replaceAll('%THEME_COLOR%', brand.themeColor)
        .replaceAll('%ROBOTS%', robots);
    },
    configureServer(server) {
      server.middlewares.use('/manifest.webmanifest', (_req, res) => {
        res.setHeader('Content-Type', 'application/manifest+json');
        res.end(manifest());
      });
    },
    generateBundle(_opts, bundle) {
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifest() });
      const assets = Object.keys(bundle).filter((f) => !f.endsWith('.map'));
      const precache = ['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png', ...assets];
      const version = `${brand.shortName.replace(/\W+/g, '-').toLowerCase()}-${Date.now()}`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: serviceWorker(version, precache) });
    },
  };
}

// Offline-first shell. Everything the app needs is precached at install, so it
// works on a train with no signal. Nothing personal is ever cached here: all of
// her data lives in IndexedDB and never touches the network.
function serviceWorker(version: string, precache: string[]) {
  return `const CACHE = ${JSON.stringify(version)};
const PRECACHE = ${JSON.stringify(precache)};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
`;
}

export default defineConfig({
  base: './',
  plugins: [preact(), brandAndPwa()],
  build: { sourcemap: false },
});
