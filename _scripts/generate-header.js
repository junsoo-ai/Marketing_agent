#!/usr/bin/env node
/**
 * Usage: node generate-header.js <YYYY-MM-DD> <"WEEKDAY, MON DD"> <"LABEL1"> <"LABEL2"> <"LABEL3">
 * Example:
 *   node generate-header.js 2026-04-28 "TUE, APR 28" "BTC $76,374 -0.81%" "FED HOLD 3.50%" "BRENT $104"
 *
 * Output: ../_content/<YYYY-MM-DD>/header.png
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// ── Args ──────────────────────────────────────────────────────────────────────
const [,, dateSlug, dateLabel, pill1, pill2, pill3] = process.argv;

if (!dateSlug || !dateLabel) {
  console.error('Usage: node generate-header.js <YYYY-MM-DD> <"WEEKDAY, MON DD"> ["LABEL1"] ["LABEL2"] ["LABEL3"]');
  process.exit(1);
}

const pills = [pill1, pill2, pill3].filter(Boolean);
const outputDir = path.join(__dirname, '..', '_content', dateSlug);
const outputPath = path.join(outputDir, 'header.png');
fs.mkdirSync(outputDir, { recursive: true });

// ── Design tokens (from design_style_guide.md) ────────────────────────────────
const W = 1200;
const H = 400;
const BG       = '#0d1117';
const BG_CARD  = '#10141b';
const BORDER   = '#1a212d';
const BORDER2  = '#232b3a';
const ACCENT   = '#94f1e8';   // mint
const FG       = '#e8edf5';
const FG2      = '#9aa5b8';
const FG4      = '#5d6878';
const GOOD     = '#4dd9a3';

// ── Candlestick data (deterministic seed from dateSlug) ──────────────────────
function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}
const seed = dateSlug.replace(/-/g, '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
const rand = seededRandom(seed);

function generateCandles(n) {
  const candles = [];
  let price = 75000 + rand() * 5000;
  for (let i = 0; i < n; i++) {
    const move = (rand() - 0.48) * 2000;
    const open = price;
    const close = price + move;
    const high = Math.max(open, close) + rand() * 800;
    const low  = Math.min(open, close) - rand() * 800;
    candles.push({ open, close, high, low });
    price = close;
  }
  return candles;
}

const candles = generateCandles(28);
const allPrices = candles.flatMap(c => [c.high, c.low]);
const minP = Math.min(...allPrices);
const maxP = Math.max(...allPrices);

// ── Chart area coords ─────────────────────────────────────────────────────────
const CX = 580;   // chart x start
const CY = 60;    // chart y start
const CW = 580;   // chart width
const CH = 280;   // chart height
const candleW = Math.floor(CW / candles.length);

function py(price) {
  return CY + CH - ((price - minP) / (maxP - minP)) * CH;
}

// ── Build candlestick SVG elements ───────────────────────────────────────────
let candleSVG = '';
candles.forEach((c, i) => {
  const x = CX + i * candleW + candleW * 0.1;
  const bw = candleW * 0.68;
  const isUp = c.close >= c.open;
  const col = isUp ? GOOD : '#f87171';
  const opacity = 0.18 + (i / candles.length) * 0.32; // fade in left to right
  const bodyTop = py(Math.max(c.open, c.close));
  const bodyH = Math.max(1, Math.abs(py(c.open) - py(c.close)));
  const cx = x + bw / 2;
  candleSVG += `
    <line x1="${cx}" y1="${py(c.high)}" x2="${cx}" y2="${py(c.low)}"
          stroke="${col}" stroke-width="0.7" opacity="${opacity}"/>
    <rect x="${x}" y="${bodyTop}" width="${bw}" height="${bodyH}"
          fill="${col}" opacity="${opacity}"/>`;
});

// ── Grid lines ────────────────────────────────────────────────────────────────
let gridSVG = '';
for (let i = 0; i <= 4; i++) {
  const y = CY + (CH / 4) * i;
  gridSVG += `<line x1="${CX}" y1="${y}" x2="${CX + CW}" y2="${y}"
    stroke="${BORDER}" stroke-width="1" stroke-dasharray="3,6" opacity="0.5"/>`;
}

// ── Pill badges ───────────────────────────────────────────────────────────────
let pillSVG = '';
let px2 = 72;
pills.forEach(label => {
  const charW = 7.8;
  const pillW = label.length * charW + 24;
  pillSVG += `
    <rect x="${px2}" y="246" width="${pillW}" height="24" rx="4"
          fill="${BG_CARD}" stroke="${BORDER2}" stroke-width="1"/>
    <text x="${px2 + pillW / 2}" y="263" text-anchor="middle"
          font-family="monospace" font-size="11" letter-spacing="0.08em"
          fill="${FG2}" font-weight="600">${label}</text>`;
  px2 += pillW + 10;
});

// ── Accent rule under wordmark ─────────────────────────────────────────────────
const accentRuleW = 220;

// ── Full SVG ──────────────────────────────────────────────────────────────────
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="fadein" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${BG}" stop-opacity="1"/>
      <stop offset="35%" stop-color="${BG}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="chartclip">
      <rect x="${CX}" y="${CY - 10}" width="${CW}" height="${CH + 20}"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="${BG}"/>

  <!-- Subtle card panel left -->
  <rect x="0" y="0" width="560" height="${H}" fill="${BG_CARD}" opacity="0.5"/>

  <!-- Top border accent line -->
  <line x1="0" y1="0" x2="${W}" y2="0" stroke="${ACCENT}" stroke-width="1.5" opacity="0.6"/>

  <!-- Bottom border -->
  <line x1="0" y1="${H - 1}" x2="${W}" y2="${H - 1}" stroke="${BORDER}" stroke-width="1"/>

  <!-- Vertical separator -->
  <line x1="560" y1="0" x2="560" y2="${H}" stroke="${BORDER}" stroke-width="1"/>

  <!-- Grid lines -->
  <g clip-path="url(#chartclip)">${gridSVG}</g>

  <!-- Candlesticks -->
  <g clip-path="url(#chartclip)">${candleSVG}</g>

  <!-- Chart fade overlay (left edge blends into panel) -->
  <rect x="${CX}" y="0" width="80" height="${H}" fill="url(#fadein)"/>

  <!-- CLYPT DAILY wordmark -->
  <text x="72" y="110"
        font-family="monospace" font-size="38" font-weight="700"
        fill="${FG}" letter-spacing="-0.01em">CLYPT</text>
  <text x="72" y="148"
        font-family="monospace" font-size="38" font-weight="700"
        fill="${ACCENT}" letter-spacing="-0.01em">DAILY</text>

  <!-- Accent rule -->
  <line x1="72" y1="165" x2="${72 + accentRuleW}" y2="165"
        stroke="${ACCENT}" stroke-width="1" opacity="0.4"/>

  <!-- Date label -->
  <text x="72" y="192"
        font-family="monospace" font-size="13" font-weight="600"
        fill="${FG4}" letter-spacing="0.12em">${dateLabel} · EST</text>

  <!-- Pill badges -->
  ${pillSVG}

  <!-- Bottom tagline -->
  <text x="72" y="${H - 24}"
        font-family="monospace" font-size="10" font-weight="400"
        fill="${FG4}" letter-spacing="0.1em" opacity="0.6">Trade with AI, not at it.</text>
</svg>`;

// ── Convert SVG → PNG via sharp ───────────────────────────────────────────────
sharp(Buffer.from(svg))
  .png()
  .toFile(outputPath)
  .then(() => console.log(`✓ Header saved: ${outputPath}`))
  .catch(err => { console.error('Error:', err.message); process.exit(1); });
