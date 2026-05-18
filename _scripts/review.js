#!/usr/bin/env node
// Review daily Discord content with Claude API
// Usage: node _scripts/review.js <YYYY-MM-DD>
// Requires: ANTHROPIC_API_KEY environment variable

const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const date = process.argv[2] || new Date().toISOString().slice(0, 10);
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const contentDir = path.join(__dirname, '..', '_content', date);

function readFile(name) {
  const p = path.join(contentDir, name);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8').trim() : null;
}

const enDiscord = readFile('daily-discord-en.md');
const koDiscord = readFile('daily-discord-ko.md');
const enUpdate  = readFile('daily-update-en.md');
const koUpdate  = readFile('daily-update-ko.md');

if (!enDiscord && !koDiscord) {
  console.error(`No content found for ${date} in ${contentDir}`);
  process.exit(1);
}

const CHECKLIST = `
CLYPT DAILY CONTENT REVIEW CHECKLIST

Brand voice: ClyptAI — "The Gateway to Agent Trading". Dense, precise, evidence-led.
Target: Retail crypto traders on Hyperliquid. Sophisticated but not academic.

DISCORD FORMAT RULES:
1. Line 1: BTC and ETH must show 24h% AND 7d% (e.g. "+2.1% 24h | +5.4% 7d")
2. Line 2: Indices (NDX/S&P/Dow) show 24h% only
3. Line 3: Commodities/rates (Gold, WTI, Brent, DXY, 10Y, VIX) show spot price only — no %
4. Must have exactly 5 macro bullet points
5. Must have a crypto on-chain paragraph (exchange flows, ETF, whale)
6. Must have a perp paragraph (OI, funding, Hyperliquid mention)
7. Must end with "Level to watch" line + Regime label (Trending/Choppy/High-Vol/Ranging)
8. Length: 170–300 words total (Discord cut)

QUALITY RULES:
- No AI filler phrases ("it is important to note", "furthermore", "it's worth mentioning")
- All numbers must be specific (no vague "significant increase")
- No repeated structure across all 5 bullets (vary sentence length)
- Korean version must read naturally, not like a translation
`;

async function reviewContent() {
  console.log(`\nReviewing content for ${date}...\n`);

  const parts = [];
  if (enDiscord) parts.push(`=== ENGLISH DISCORD ===\n${enDiscord}`);
  if (koDiscord) parts.push(`=== KOREAN DISCORD ===\n${koDiscord}`);

  const prompt = `${CHECKLIST}

---
CONTENT TO REVIEW:

${parts.join('\n\n')}

---
Review each piece against the checklist. For each issue found:
- State which file (EN/KO)
- State which rule was violated
- Quote the exact problematic text
- Give a one-line fix

End with:
OVERALL: PASS or FAIL
ISSUES_COUNT: N
SUMMARY: one sentence

Be terse. Only flag real problems — don't invent issues.`;

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  return msg.content[0].text;
}

reviewContent().then(result => {
  console.log(result);
  process.exitCode = result.includes('OVERALL: FAIL') ? 1 : 0;
}).catch(err => {
  console.error('Review failed:', err.message);
  process.exit(1);
});
