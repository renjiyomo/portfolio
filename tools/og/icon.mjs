/* ==========================================================================
   icon.mjs — assets/favicon.svg  ->  public/assets/icons/apple-touch-icon.png
   --------------------------------------------------------------------------
   iOS ignores `rel=apple-touch-icon` when it points at an SVG, so the one
   raster icon the site still needs gets rendered from the same source of
   truth as the favicon rather than maintained as a second drawing.

     node tools/og/icon.mjs

   Same headless-Chrome approach as render.mjs, and deliberately the same
   shape of script: find a Chromium, screenshot at an exact size, then verify
   the PNG header before trusting the file. Chrome is already on the machine,
   so this stays a zero-dependency repo.

   Why the wrapper HTML:
     Screenshotting an SVG directly gives Chrome no viewport to honour and no
     way to fill the corner pixels. iOS masks the icon to its own rounded
     rectangle and composites it on white if there is any transparency, so the
     tile is painted opaque here at the site's canvas colour.
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');

const SOURCE = resolve(ROOT, 'public', 'assets', 'favicon.svg');
const OUT    = resolve(ROOT, 'public', 'assets', 'icons', 'apple-touch-icon.png');
const SHIM   = resolve(HERE, '.icon-shim.html');

/* 180x180 is the largest size iOS asks for; it downsamples the rest. */
const SIZE = 180;

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA && `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

function findChrome() {
  const hit = CANDIDATES.find((p) => existsSync(p));
  if (hit) return hit;

  throw new Error(
    'No Chrome or Edge binary found. Set CHROME_PATH to one and re-run:\n' +
    '  CHROME_PATH="/path/to/chrome" node tools/og/icon.mjs'
  );
}

function readPngSize(file) {
  const head = readFileSync(file).subarray(0, 33);

  const isPng =
    head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;

  if (!isPng) throw new Error(`${file} is not a PNG.`);

  return { w: head.readUInt32BE(16), h: head.readUInt32BE(20) };
}

/* The mark bleeds to the tile edge: iOS applies its own corner radius, so the
   SVG's rounded corners would sit inside a second rounded shape, and its inset
   hairline border would get clipped unevenly by the mask. Both are dropped
   here — the favicon keeps them, the touch icon is a flat tile plus mark. */
function shim() {
  const svg = readFileSync(SOURCE, 'utf8');

  return `<!DOCTYPE html>
<meta charset="utf-8">
<style>
  html, body { margin: 0; background: #0B0D0E; }
  body { width: ${SIZE}px; height: ${SIZE}px; overflow: hidden; }
  svg  { display: block; width: ${SIZE}px; height: ${SIZE}px; }
  /* rect 1 is the tile, rect 2 is the hairline frame. */
  svg rect:nth-of-type(1) { rx: 0; }
  svg rect:nth-of-type(2) { display: none; }
</style>
${svg}`;
}

function main() {
  const chrome = findChrome();
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(SHIM, shim(), 'utf8');

  try {
    execFileSync(chrome, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--force-device-scale-factor=1',
      `--window-size=${SIZE},${SIZE}`,
      '--virtual-time-budget=4000',
      `--screenshot=${OUT}`,
      pathToFileURL(SHIM).href,
    ], { stdio: ['ignore', 'ignore', 'inherit'] });
  } finally {
    rmSync(SHIM, { force: true });
  }

  if (!existsSync(OUT)) throw new Error('Chrome exited without writing a file.');

  const { w, h } = readPngSize(OUT);
  if (w !== SIZE || h !== SIZE) {
    throw new Error(`Expected ${SIZE}x${SIZE}, got ${w}x${h}.`);
  }

  const kb = (statSync(OUT).size / 1024).toFixed(1);
  console.log(`apple-touch-icon.png  ${w}x${h}  ${kb} KB`);
  console.log(`  ${OUT}`);
}

main();
