import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const pages = ['public/index.html', 'public/blender/index.html', 'public/room/index.html'];
const hashes = new Set();
for (const page of pages) {
  const html = readFileSync(path.join(root, page), 'utf8').replace(/\r\n?/g, '\n');
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/i.test(match[1])) continue;
    hashes.add(`'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`);
  }
}

const policy = [
  "default-src 'self'",
  `script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net ${[...hashes].join(' ')}`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://gh-calendar.rschristian.dev https://github-contributions.vercel.app https://cdn.jsdelivr.net https://www.gstatic.com",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

const headers = [
  { key: 'Content-Security-Policy', value: policy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
];
const config = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  git: { deploymentEnabled: { '**': false, main: true } },
  headers: [{ source: '/(.*)', headers }],
};

const configText = JSON.stringify(config, null, 2) + '\n';
const apachePath = path.join(root, 'public/.htaccess');
const apacheOriginal = readFileSync(apachePath, 'utf8').replace(/\r\n?/g, '\n');
const marker = '# BEGIN generated portfolio security headers';
const endMarker = '# END generated portfolio security headers';
const apacheBlock = [
  marker,
  '# Regenerate after changing inline scripts: node tools/update-security-headers.mjs',
  '<IfModule mod_headers.c>',
  ...headers.map(({ key, value }) => `  Header always set ${key} "${value}"`),
  '</IfModule>',
  endMarker,
].join('\n');
const withoutBlock = apacheOriginal.includes(marker)
  ? apacheOriginal.slice(0, apacheOriginal.indexOf(marker)).trimEnd()
  : apacheOriginal.trimEnd();
const apacheText = withoutBlock + '\n\n' + apacheBlock + '\n';
if (process.argv.includes('--check')) {
  const actual = readFileSync(path.join(root, 'vercel.json'), 'utf8').replace(/\r\n?/g, '\n');
  if (actual !== configText || apacheOriginal !== apacheText) {
    throw new Error('Security headers are out of date. Run node tools/update-security-headers.mjs.');
  }
  console.log(`Security headers match ${hashes.size} inline script hashes across ${pages.length} pages.`);
} else {
  writeFileSync(path.join(root, 'vercel.json'), configText);
  writeFileSync(apachePath, apacheText);
  console.log('Updated Vercel and Apache security headers.');
}
