/* ==========================================================================
   render.mjs — og-card.html  ->  public/assets/og/og-cover.png
   --------------------------------------------------------------------------
   Renders the link-preview card with headless Chrome. No npm dependencies:
   the browser is already on the machine, and the alternative (a canvas or
   SVG rasteriser) cannot lay out real webfont text.

     node tools/og/render.mjs

   Why headless Chrome and not an SVG:
     Social platforms do not rasterise SVG for og:image — the file has to be
     a PNG or JPEG. Chrome gives us the site's actual font stack, real
     kerning and real gradient masks, which is exactly what makes the card
     look designed rather than generated.

   Why --virtual-time-budget:
     `--screenshot` fires as soon as the load event settles, which is before
     Google Fonts has finished swapping in. Virtual time pauses the clock
     until the network is idle, so the shot is taken with Instrument Sans and
     JetBrains Mono actually painted. `display=block` in the font URL stops
     Chrome painting a fallback face in the meantime.
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');

const SOURCE = resolve(HERE, 'og-card.html');
const OUT    = resolve(ROOT, 'public', 'assets', 'og', 'og-cover.png');

const WIDTH  = 1200;
const HEIGHT = 630;

/* Chrome, wherever this machine keeps it. Stable channel first, then Edge —
   both are Chromium and both honour --screenshot identically. */
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
    '  CHROME_PATH="/path/to/chrome" node tools/og/render.mjs'
  );
}

/* PNG header check. A screenshot that silently came out at the wrong size —
   a stale --force-device-scale-factor, a Chrome that ignored --window-size —
   is worse than a failed render, because the platforms would cache it. */
function readPngSize(file) {
  const head = readFileSync(file).subarray(0, 33);

  const isPng =
    head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;

  if (!isPng) throw new Error(`${file} is not a PNG.`);

  return { w: head.readUInt32BE(16), h: head.readUInt32BE(20) };
}

function main() {
  const chrome = findChrome();
  mkdirSync(dirname(OUT), { recursive: true });

  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    /* 1 device pixel per CSS pixel — the card is authored at final size. */
    '--force-device-scale-factor=1',
    `--window-size=${WIDTH},${HEIGHT}`,
    /* Hold the clock until fonts and gradients have landed. */
    '--virtual-time-budget=12000',
    `--screenshot=${OUT}`,
    pathToFileURL(SOURCE).href,
  ], { stdio: ['ignore', 'ignore', 'inherit'] });

  if (!existsSync(OUT)) throw new Error('Chrome exited without writing a file.');

  const { w, h } = readPngSize(OUT);
  if (w !== WIDTH || h !== HEIGHT) {
    throw new Error(`Expected ${WIDTH}x${HEIGHT}, got ${w}x${h}.`);
  }

  const kb = (statSync(OUT).size / 1024).toFixed(1);
  console.log(`og-cover.png  ${w}x${h}  ${kb} KB`);
  console.log(`  ${OUT}`);
}

main();
