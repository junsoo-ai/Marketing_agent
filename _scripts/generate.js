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
      search_depth: 'basic',
      max_results: 3,
      include_answer: false,
    }),
  });
  const data = await res.json();
  return (data.results || [])
    .map(r => `[${r.source || r.url}] ${r.title}\n${(r.content || '').slice(0, 400)}`)
    .join('\n\n');
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
  console.log('CoinGecko response:', JSON.stringify(cg).slice(0, 200));

  if (!cg.bitcoin || !cg.ethereum) {
    throw new Error(`CoinGecko returned unexpected data: ${JSON.stringify(cg)}`);
  }

  const fmt = (n, decimals = 1) => (n > 0 ? '+' : '') + Number(n).toFixed(decimals);
  const btcPrice = `BTC $${Math.round(cg.bitcoin.usd).toLocaleString()} (${fmt(cg.bitcoin.usd_24h_change)}% 24h | ${fmt(cg.bitcoin.usd_7d_change)}% 7d)`;
  const ethPrice = `ETH $${Math.round(cg.ethereum.usd).toLocaleString()} (${fmt(cg.ethereum.usd_24h_change)}% 24h | ${fmt(cg.ethereum.usd_7d_change)}% 7d)`;

  // 2. Macro news searches
  console.log('Searching macro news...');
  const [macro1, macro2, macro3, macro4, macro5] = await Promise.all([
    tavilySearch(`global stock markets Nasdaq S&P Dow ${date}`),
    tavilySearch(`US Federal Reserve interest rates inflation CPI ${date}`),
    tavilySearch(`oil prices OPEC geopolitics energy ${date}`),
    tavilySearch(`central bank rate decision trade policy ${date}`),
    tavilySearch(`US dollar DXY Treasury yields bonds ${date}`),
  ]);

  // 3. Crypto signal searches
  console.log('Searching crypto signals...');
  const [crypto1, crypto2, crypto3, crypto4, crypto5] = await Promise.all([
    tavilySearch(`bitcoin exchange flows reserves on-chain ${date}`),
    tavilySearch(`bitcoin ethereum open interest perpetual funding rate ${date}`),
    tavilySearch(`bitcoin spot ETF flows Blackrock Fidelity ${date}`),
    tavilySearch(`Hyperliquid BTC perpetual funding rate open interest ${date}`),
    tavilySearch(`bitcoin ethereum price support resistance technical level ${date}`),
  ]);

  // 4. Load previous day content for dedup check
  const prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateStr = prevDate.toISOString().slice(0, 10);
  const prevPath = path.join(__dirname, '..', '_content', prevDateStr, 'daily-discord-en.md');
  const prevContent = fs.existsSync(prevPath)
    ? `PREVIOUS DAY (${prevDateStr}):\n${fs.readFileSync(prevPath, 'utf8')}`
    : '';

  // 5. Generate with Claude
  console.log('Generating with Claude...');

  const prompt = `You are the ClyptAI marketing agent. Generate today's daily Discord posts.

Today's date: ${date}

LIVE CRYPTO PRICES:
${btcPrice}
${ethPrice}

MACRO NEWS SEARCH RESULTS:
Query 1 (markets/indices): ${macro1}

Query 2 (Fed/inflation): ${macro2}

Query 3 (oil/energy): ${macro3}

Query 4 (central banks/trade): ${macro4}

Query 5 (dollar/bonds): ${macro5}

CRYPTO SIGNAL SEARCH RESULTS:
Query 1 (exchange flows/on-chain): ${crypto1}

Query 2 (OI/funding rate): ${crypto2}

Query 3 (ETF flows): ${crypto3}

Query 4 (Hyperliquid): ${crypto4}

Query 5 (price levels): ${crypto5}

${prevContent}

DISCORD FORMAT RULES:
- Line 1: BTC and ETH with 24h% AND 7d% (use the live prices above exactly as given)
- Line 2: Nasdaq/S&P/Dow with 24h% only (extract from search results)
- Line 3: Gold, WTI, Brent, DXY, 10Y, VIX — spot price only, no %
- Exactly 5 macro bullet points — each a distinct event from different regions/assets
- One crypto on-chain paragraph (exchange flows, ETF, whale/institutional)
- One perp paragraph (OI, funding rate, must mention Hyperliquid)
- End with "Level to watch: $X (indicator). Spot X% below/above. Regime: [Trending/Choppy/High-Vol/Ranging]."
- 150–200 words total
- No AI filler phrases. All numbers specific. Variable sentence lengths.
- No competitor names. No price predictions.
- Do not repeat stories from the previous day.

OUTPUT FORMAT — use these exact markers, nothing outside them:
===DISCORD_EN===
[English Discord post here]
===END_DISCORD_EN===

===DISCORD_KO===
[Korean Discord post here — natural Korean financial writing, not a translation]
===END_DISCORD_KO===`;

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const output = msg.content[0].text;

  const enMatch = output.match(/===DISCORD_EN===\n([\s\S]+?)\n===END_DISCORD_EN===/);
  const koMatch = output.match(/===DISCORD_KO===\n([\s\S]+?)\n===END_DISCORD_KO===/);

  if (!enMatch || !koMatch) {
    console.error('Failed to parse output:\n', output);
    process.exit(1);
  }

  // 6. Save files
  const contentDir = path.join(__dirname, '..', '_content', date);
  fs.mkdirSync(contentDir, { recursive: true });
  fs.writeFileSync(path.join(contentDir, 'daily-discord-en.md'), enMatch[1].trim() + '\n');
  fs.writeFileSync(path.join(contentDir, 'daily-discord-ko.md'), koMatch[1].trim() + '\n');

  console.log(`Saved to _content/${date}/daily-discord-en.md`);
  console.log(`Saved to _content/${date}/daily-discord-ko.md`);
}

main().catch(err => {
  console.error('Generation failed:', err.message);
  process.exit(1);
});
