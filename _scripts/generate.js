#!/usr/bin/env node
// Auto-generate daily Discord content
// Usage: node _scripts/generate.js <YYYY-MM-DD>
// Requires: ANTHROPIC_API_KEY, TAVILY_API_KEY

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const date = process.argv[2] || new Date().toISOString().slice(0, 10);
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const tavilyKey = process.env.TAVILY_API_KEY;

if (!tavilyKey) {
  console.error('Error: TAVILY_API_KEY not set');
  process.exit(1);
}

async function tavilySearch(query) {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: tavilyKey,
      query,
      search_depth: 'advanced',
      max_results: 5,
      include_answer: true,
    }),
  });
  const data = await res.json();
  const answer = data.answer ? `ANSWER: ${data.answer}\n\n` : '';
  const results = (data.results || [])
    .map(r => `[${r.url}] ${r.title}\n${(r.content || '').slice(0, 500)}`)
    .join('\n\n');
  return answer + results;
}

async function main() {
  console.log(`Generating content for ${date}...`);

  // 1. Crypto prices from CoinGecko
  console.log('Fetching crypto prices...');
  const cgUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_7d_change=true';
  const cgHeaders = process.env.COINGECKO_API_KEY
    ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY }
    : {};
  const cgRes = await fetch(cgUrl, { headers: cgHeaders });
  const cg = await cgRes.json();

  if (!cg.bitcoin || !cg.ethereum) {
    throw new Error(`CoinGecko returned unexpected data: ${JSON.stringify(cg)}`);
  }

  const fmtPct = (n) => n == null ? '?' : (n > 0 ? '+' : '') + Number(n).toFixed(1);
  const btcPrice = `BTC $${Math.round(cg.bitcoin.usd).toLocaleString()} (${fmtPct(cg.bitcoin.usd_24h_change)}% 24h | ${fmtPct(cg.bitcoin.usd_7d_change)}% 7d)`;
  const ethPrice = `ETH $${Math.round(cg.ethereum.usd).toLocaleString()} (${fmtPct(cg.ethereum.usd_24h_change)}% 24h | ${fmtPct(cg.ethereum.usd_7d_change)}% 7d)`;

  // 2. Market data searches (prices + news)
  console.log('Searching market data and news...');
  const [
    indicesData,
    commoditiesData,
    macro1, macro2, macro3,
    crypto1, crypto2, crypto3, crypto4,
  ] = await Promise.all([
    tavilySearch(`Nasdaq S&P 500 Dow Jones closing price today ${date}`),
    tavilySearch(`Gold WTI Brent crude oil DXY 10-year Treasury yield VIX price today ${date}`),
    tavilySearch(`major global markets economic news event ${date}`),
    tavilySearch(`Federal Reserve inflation CPI central bank rate decision ${date}`),
    tavilySearch(`geopolitics trade policy oil OPEC currency news ${date}`),
    tavilySearch(`bitcoin exchange outflow inflow reserve on-chain whale ${date}`),
    tavilySearch(`bitcoin ethereum ETF flows institutional open interest funding rate ${date}`),
    tavilySearch(`Hyperliquid BTC ETH perpetual funding rate open interest ${date}`),
    tavilySearch(`bitcoin ethereum key price level support resistance technical ${date}`),
  ]);

  // 3. Load previous day content for dedup
  const prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateStr = prevDate.toISOString().slice(0, 10);
  const prevPath = path.join(__dirname, '..', '_content', prevDateStr, 'daily-discord-en.md');
  const prevContent = fs.existsSync(prevPath)
    ? `PREVIOUS DAY CONTENT (do NOT repeat these stories):\n${fs.readFileSync(prevPath, 'utf8')}`
    : '';

  // 4. Generate with Claude
  console.log('Generating with Claude...');

  const referenceExample = `BTC $76,934 (-1.0% 24h | -3.5% 7d) · ETH $2,115 (-2.5% 24h | -5.8% 7d)
Nasdaq 26,225 (-1.5% 24h) · S&P 7,409 (-1.2% 24h) · Dow 49,526 (-1.1% 24h)
Gold $4,544 · WTI $101.0 · Brent $109.3 · DXY 99.2 · 10Y 4.44% · VIX 18.4
Warsh just took the Fed chair and the bond market isn't celebrating — 30-year yields cleared 5% for the first time since 2007.

Five things worth reading today:

• S&P dropped 1.24% to 7,409 Friday. Warsh confirmation, yields spiking, and a US-China summit that ended without any trade breakthroughs all landed in the same session.
• US CPI came in at 3.8% in April — above the 3.7% forecast. Energy is up 18% year-over-year. Rate cuts are off the table.
• RBA hiked to 4.35%, third consecutive 2026 increase, 8-1 vote. Middle East energy costs pushed the inflation peak estimate to 4.8% by mid-year.
• IEA forecasts global oil demand contracting 420 kb/d in 2026. Brent still hit $109 because Hormuz supply risk is overriding the weak demand signal.
• Dow fell 537 points to 49,526 on the same Friday session. All major indices closed red as yield pressure dominated.

25,644 BTC left exchanges in 24 hours — reserves now at a 7-year low of 2.21M BTC. Spot ETFs logged nine consecutive inflow days totaling $2.7B through May 9, with BlackRock IBIT and Fidelity FBTC leading. Institutional positioning remains net long despite the pullback from $80K.

BTC perp OI contracted through the weekend as ETH underperformed BTC on a 24h basis (2.5% vs 1.0%), signaling altcoin deleveraging. Hyperliquid BTC-PERP funding near neutral — no dominant directional bias at current levels.

Level to watch: $79,383 (200-DMA). Spot is 3.3% below it. Daily close above reclaims the trend reference.
Regime: Choppy.`;

  const prompt = `You are the ClyptAI daily market writer. Generate today's Discord post matching EXACTLY the style, length, and structure of the reference example below.

TODAY'S DATE: ${date}

REFERENCE EXAMPLE (match this format exactly — same depth, same word count ~180 words, same structure):
${referenceExample}

---
LIVE CRYPTO PRICES (use these exactly for line 1):
${btcPrice}
${ethPrice}

INDICES & PRICE DATA (extract exact numbers for lines 2-3):
${indicesData}

COMMODITIES DATA (Gold, WTI, Brent, DXY, 10Y, VIX for line 3):
${commoditiesData}

MACRO NEWS (pick 5 distinct events, each different region/asset class):
${macro1}

${macro2}

${macro3}

CRYPTO SIGNALS:
${crypto1}

${crypto2}

${crypto3}

${crypto4}

${prevContent}

---
STRICT FORMAT RULES — violations will cause rejection:
1. Line 1: "BTC $X (±X.X% 24h | ±X.X% 7d) · ETH $X (±X.X% 24h | ±X.X% 7d)" — use live prices above
2. Line 2: "Nasdaq X,XXX (±X.X% 24h) · S&P X,XXX (±X.X% 24h) · Dow XX,XXX (±X.X% 24h)" — extract from search data
3. Line 3: "Gold $X,XXX · WTI $XXX.X · Brent $XXX.X · DXY XX.X · 10Y X.XX% · VIX XX.X" — spot prices only
4. One punchy intro sentence summarizing the biggest macro theme of the day
5. "Five things worth reading today:" header — exactly this text
6. Exactly 5 bullet points (•), each covering a DIFFERENT story/region/asset
7. One on-chain paragraph: exchange flows + ETF flows + institutional positioning (specific numbers)
8. One perp paragraph: OI + funding rate + Hyperliquid mention (specific numbers)
9. Last line: "Level to watch: $X (indicator). Spot X.X% below/above it. [one-sentence context]"
10. Final line: "Regime: [Trending/Choppy/High-Vol/Ranging]."
11. NO markdown — no **, no ##, no [], no backticks
12. NO vague language — every number must be specific
13. 170–200 words total
14. Each bullet: 1-2 sentences max, punchy, data-led, variable length

OUTPUT FORMAT — nothing outside these markers:
===DISCORD_EN===
[English content]
===END_DISCORD_EN===

===DISCORD_KO===
[Korean content — natural Korean financial writing, same structure, not a word-for-word translation]
===END_DISCORD_KO===`;

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const output = msg.content[0].text;

  const enMatch = output.match(/===DISCORD_EN===\n([\s\S]+?)\n===END_DISCORD_EN===/);
  const koMatch = output.match(/===DISCORD_KO===\n([\s\S]+?)\n===END_DISCORD_KO===/);

  if (!enMatch || !koMatch) {
    console.error('Failed to parse output:\n', output);
    process.exit(1);
  }

  const contentDir = path.join(__dirname, '..', '_content', date);
  fs.mkdirSync(contentDir, { recursive: true });
  fs.writeFileSync(path.join(contentDir, 'daily-discord-en.md'), enMatch[1].trim() + '\n');
  fs.writeFileSync(path.join(contentDir, 'daily-discord-ko.md'), koMatch[1].trim() + '\n');

  console.log(`Saved _content/${date}/daily-discord-en.md`);
  console.log(`Saved _content/${date}/daily-discord-ko.md`);
}

main().catch(err => {
  console.error('Generation failed:', err.message);
  process.exit(1);
});
