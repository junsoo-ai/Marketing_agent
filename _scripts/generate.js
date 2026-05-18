#!/usr/bin/env node
// Auto-generate daily Discord + update content
// Usage: node _scripts/generate.js <YYYY-MM-DD>
// Requires: ANTHROPIC_API_KEY, TAVILY_API_KEY

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const date = process.argv[2] || new Date().toISOString().slice(0, 10);
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const tavilyKey = process.env.TAVILY_API_KEY;

if (!tavilyKey) { console.error('Error: TAVILY_API_KEY not set'); process.exit(1); }

async function tavilySearch(query) {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: tavilyKey, query, search_depth: 'advanced', max_results: 5, include_answer: true }),
  });
  const data = await res.json();
  const answer = data.answer ? `ANSWER: ${data.answer}\n\n` : '';
  return answer + (data.results || []).map(r => `[${r.url}] ${r.title}\n${(r.content || '').slice(0, 500)}`).join('\n\n');
}

const REF_EN_DISCORD = `BTC $76,934 (-1.0% 24h | -3.5% 7d) · ETH $2,115 (-2.5% 24h | -5.8% 7d)
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

const REF_KO_DISCORD = `BTC $76,934 (-1.0% 24h | -3.5% 7d) · ETH $2,115 (-2.5% 24h | -5.8% 7d)
나스닥 26,225 (-1.5% 24h) · S&P 7,409 (-1.2% 24h) · 다우 49,526 (-1.1% 24h)
금 $4,544 · WTI $101.0 · 브렌트 $109.3 · DXY 99.2 · 10년물 4.44% · VIX 18.4
워시가 연준 의장직을 막 인수했고, 채권 시장은 환영하지 않고 있다 — 30년 금리가 2007년 이후 처음으로 5%를 돌파했다.

주목할 만한 다섯 가지 기사:

• S&P 500, 금요일 1.24% 하락해 7,409 마감. 워시 인준, 금리 급등, 성과 없이 끝난 미중 정상회담이 같은 세션에 겹쳤다.

• 미국 4월 CPI 3.8% 상승 — 예상치 3.7% 상회. 에너지가 전년 대비 18% 올랐다. 금리 인하 가능성은 사실상 소멸했다.

• 호주 중앙은행, 4.35%로 인상 — 2026년 세 번째 연속 인상, 8대 1 표결. 중동발 에너지 비용이 올해 중반 인플레이션 정점 추정치를 4.8%로 끌어올렸다.

• IEA, 2026년 글로벌 원유 수요 420 kb/d 감소 전망. 브렌트유는 호르무즈 공급 리스크가 약한 수요 신호를 압도하며 여전히 $109를 기록했다.

• 다우, 537포인트 하락해 49,526 금요일 마감. 금리 압력이 지배하면서 주요 지수 모두 하락 마감.

24시간 동안 25,644 BTC가 거래소에서 인출됐다 — 보유량이 7년 만의 최저치인 221만 BTC로 감소했다. 현물 ETF는 5월 9일까지 9거래일 연속 순유입을 기록하며 약 27억 달러를 끌어들였고, 블랙록 IBIT와 피델리티 FBTC가 선두.

무기한 선물 OI는 주말 동안 축소됐으며, ETH가 BTC(1.0%) 대비 2.5% 하락하며 알트코인 디레버리징 신호를 보였다. 하이퍼리퀴드 BTC-PERP 펀딩 중립 근접 — 현재 가격대에서 뚜렷한 방향성 편향 없음.

주목할 레벨: $79,383 (200일 SMA). 현물은 3.3% 아래에 위치. 일봉 종가 탈환 시 추세 기준선 회복.
장세: 횡보(Choppy).`;

async function main() {
  console.log(`Generating content for ${date}...`);

  // 1. Crypto prices
  console.log('Fetching crypto prices...');
  const cgUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_7d_change=true';
  const cgHeaders = process.env.COINGECKO_API_KEY ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY } : {};
  const cgRes = await fetch(cgUrl, { headers: cgHeaders });
  const cg = await cgRes.json();
  if (!cg.bitcoin || !cg.ethereum) throw new Error(`CoinGecko error: ${JSON.stringify(cg)}`);

  const fmtPct = (n) => n == null ? '?' : (n > 0 ? '+' : '') + Number(n).toFixed(1);
  const btcPrice = `BTC $${Math.round(cg.bitcoin.usd).toLocaleString()} (${fmtPct(cg.bitcoin.usd_24h_change)}% 24h | ${fmtPct(cg.bitcoin.usd_7d_change)}% 7d)`;
  const ethPrice = `ETH $${Math.round(cg.ethereum.usd).toLocaleString()} (${fmtPct(cg.ethereum.usd_24h_change)}% 24h | ${fmtPct(cg.ethereum.usd_7d_change)}% 7d)`;

  // 2. Searches
  console.log('Searching market data...');
  const [indicesData, commoditiesData, macro1, macro2, macro3, crypto1, crypto2, crypto3, crypto4] = await Promise.all([
    tavilySearch(`Nasdaq S&P 500 Dow Jones closing price ${date}`),
    tavilySearch(`Gold WTI Brent crude DXY 10-year Treasury VIX price ${date}`),
    tavilySearch(`major global markets economic news ${date}`),
    tavilySearch(`Federal Reserve inflation CPI central bank ${date}`),
    tavilySearch(`geopolitics trade policy oil OPEC news ${date}`),
    tavilySearch(`bitcoin exchange outflow inflow reserve on-chain ${date}`),
    tavilySearch(`bitcoin ethereum ETF flows open interest funding rate ${date}`),
    tavilySearch(`Hyperliquid BTC ETH perpetual funding rate OI ${date}`),
    tavilySearch(`bitcoin ethereum price level support resistance ${date}`),
  ]);

  // 3. Previous day for dedup
  const prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevPath = path.join(__dirname, '..', '_content', prevDate.toISOString().slice(0, 10), 'daily-discord-en.md');
  const prevContent = fs.existsSync(prevPath)
    ? `PREVIOUS DAY (do NOT repeat these stories):\n${fs.readFileSync(prevPath, 'utf8')}`
    : '';

  const searchData = `
LIVE CRYPTO PRICES (use exactly for line 1):
${btcPrice}
${ethPrice}

INDICES DATA (extract numbers for line 2):
${indicesData}

COMMODITIES DATA (extract numbers for line 3):
${commoditiesData}

MACRO NEWS:
${macro1}

${macro2}

${macro3}

CRYPTO SIGNALS:
${crypto1}

${crypto2}

${crypto3}

${crypto4}

${prevContent}`;

  // 4. Generate Discord cuts
  console.log('Generating Discord cuts...');
  const discordMsg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{ role: 'user', content: `You are the ClyptAI daily market writer. Generate today's Discord posts matching EXACTLY the style and structure of the reference examples.

TODAY: ${date}

ENGLISH REFERENCE (match format exactly):
${REF_EN_DISCORD}

KOREAN REFERENCE (match format exactly):
${REF_KO_DISCORD}

---
${searchData}

STRICT RULES:
1. Line 1: "BTC $X (±X.X% 24h | ±X.X% 7d) · ETH $X (±X.X% 24h | ±X.X% 7d)" — use live prices exactly
2. Line 2: "Nasdaq X,XXX (±X.X% 24h) · S&P X,XXX (±X.X% 24h) · Dow XX,XXX (±X.X% 24h)" — from search data
3. Line 3: "Gold $X,XXX · WTI $XXX.X · Brent $XXX.X · DXY XX.X · 10Y X.XX% · VIX XX.X" — spot only
4. One punchy intro sentence
5. EN: "Five things worth reading today:" / KO: "주목할 만한 다섯 가지 기사:" header
6. Exactly 5 bullets (•), each a DIFFERENT story/region
7. One on-chain paragraph with specific numbers
8. One perp paragraph mentioning Hyperliquid with specific numbers — Korean must use natural Korean financial phrasing, NOT translated English
9. "Level to watch: $X,XXX (one short label)." — EXACTLY ONE sentence, no elaboration
10. "Regime: [label]." on its own line immediately after — EN: Trending/Choppy/High-Vol/Ranging · KO: 상승추세/횡보/고변동/레인지 (English label in parentheses)
11. NO markdown (no **, no ##). NO vague numbers. 170-250 words each.

OUTPUT (nothing outside markers):
===DISCORD_EN===
[English]
===END_DISCORD_EN===

===DISCORD_KO===
[Korean]
===END_DISCORD_KO===` }],
  });

  const discordOut = discordMsg.content[0].text;
  const enDiscord = discordOut.match(/===DISCORD_EN===\n([\s\S]+?)\n===END_DISCORD_EN===/)?.[1]?.trim();
  const koDiscord = discordOut.match(/===DISCORD_KO===\n([\s\S]+?)\n===END_DISCORD_KO===/)?.[1]?.trim();
  if (!enDiscord || !koDiscord) { console.error('Discord parse failed:\n', discordOut); process.exit(1); }

  // 5. Generate daily updates (longer format)
  console.log('Generating daily updates...');
  const updateMsg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 6000,
    messages: [{ role: 'user', content: `You are the ClyptAI daily market writer. Generate full daily update files for ${date}.

${searchData}

Generate two files following this EXACT structure:

ENGLISH FORMAT:
# CLYPT Daily
**[Weekday], [Month DD], [YYYY] · 06:00 KST**

---
## SECTION 1 — GLOBAL EVENTS

**[Bold headline for event 1]**
[2-3 sentence paragraph with specific data and source citation in parentheses at end]

[Repeat for 5 distinct events]

---
## SECTION 2 — CRYPTO MARKETS

**Volume / derivatives signal:** [1-2 sentences with specific numbers. *(Source, date)*]

**Whale / on-chain signal:** [1-2 sentences with specific numbers. *(Source, date)*]

**ETF / institutional flow:** [1-2 sentences with specific numbers. *(Source, date)*]

**Hyperliquid Desk:** [1-2 sentences with specific numbers. *(Source, date)*]

**Level to watch:** [1-2 sentences with specific price level and context. *(Source, date)*]

**Regime:** [Label] — [1 sentence rationale].

---
*Data: [comma-separated sources]. As of [time] UTC [date]. Not financial advice.*

KOREAN FORMAT: Same structure, all text in natural Korean financial writing.

OUTPUT (nothing outside markers):
===UPDATE_EN===
[Full English daily update]
===END_UPDATE_EN===

===UPDATE_KO===
[Full Korean daily update]
===END_UPDATE_KO===` }],
  });

  const updateOut = updateMsg.content[0].text;
  const enUpdate = updateOut.match(/===UPDATE_EN===\n([\s\S]+?)\n===END_UPDATE_EN===/)?.[1]?.trim();
  const koUpdate = updateOut.match(/===UPDATE_KO===\n([\s\S]+?)\n===END_UPDATE_KO===/)?.[1]?.trim();
  if (!enUpdate || !koUpdate) { console.error('Update parse failed:\n', updateOut); process.exit(1); }

  // 6. Save all 4 files
  const contentDir = path.join(__dirname, '..', '_content', date);
  fs.mkdirSync(contentDir, { recursive: true });
  fs.writeFileSync(path.join(contentDir, 'daily-discord-en.md'), enDiscord + '\n');
  fs.writeFileSync(path.join(contentDir, 'daily-discord-ko.md'), koDiscord + '\n');
  fs.writeFileSync(path.join(contentDir, 'daily-update-en.md'), enUpdate + '\n');
  fs.writeFileSync(path.join(contentDir, 'daily-update-ko.md'), koUpdate + '\n');

  console.log(`Saved all 4 files to _content/${date}/`);
}

main().catch(err => { console.error('Generation failed:', err.message); process.exit(1); });
