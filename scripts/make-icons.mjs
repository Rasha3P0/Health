// Renders public/icons/icon.svg to the PNG sizes iOS and Android need.
// Uses a globally installed Playwright: `node scripts/make-icons.mjs`.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const globalRoot = execSync('npm root -g').toString().trim();
const { chromium } = require(`${globalRoot}/playwright`);

const svg = readFileSync('public/icons/icon.svg', 'utf8');
const targets = [
  ['icon-192.png', 192, 0],
  ['icon-512.png', 512, 0],
  ['apple-touch-icon.png', 180, 0],
  ['icon-maskable-512.png', 512, 0.12],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, pad] of targets) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * (1 - pad * 2));
  // Apple and maskable icons are cropped by the OS, so fill the square.
  const body = svg.replace('rx="112"', name === 'icon-192.png' || name === 'icon-512.png' ? 'rx="112"' : 'rx="0"');
  await page.setContent(
    `<body style="margin:0;background:#fdeadb;display:grid;place-items:center;width:${size}px;height:${size}px">` +
      `<div style="width:${inner}px;height:${inner}px">${body.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body>`,
  );
  await page.screenshot({ path: `public/icons/${name}`, omitBackground: name.startsWith('icon-') && !name.includes('maskable') });
}
await browser.close();
console.log('icons written');
