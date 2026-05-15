# CLAUDE.md — ClyptAI Marketing Agent

This workspace is operated by the ClyptAI marketing team. The primary outputs are two recurring content pieces: a **daily market update** and a **weekly newsletter**. Everything here is built around producing those two deliverables efficiently, on-brand, and with real data.

---

## What This Workspace Does

| Output | Cadence | Template |
|--------|---------|----------|
| Daily Market Update | Every weekday, before 9:00 AM UTC | `_templates/daily-market-update.md` |
| Weekly Newsletter | Every Monday, covers prior week | `_templates/weekly-newsletter.md` |

Finished content goes into `_content/` (create dated subfolders: `_content/YYYY-MM-DD/`).

---

## Folder Structure

```
Marketing_Agent/
├── CLAUDE.md                        ← you are here
├── _ir_deck/
│   └── clyptai-seed-deck.md         ← seed pitch deck: traction, team, market, business model
├── _context/
│   ├── business_context.md          ← product, users, pricing, competitive positioning
│   ├── brand_guidelines.md          ← logo, colors, typography, motion rules
│   └── design_style_guide.md        ← component patterns, layout, spacing
├── _templates/
│   ├── daily-market-update.md       ← fill-in template for daily output
│   ├── weekly-newsletter.md         ← fill-in template for weekly output
│   └── brand template.md            ← master brand reference (CLYPT identity)
└── _content/                        ← generated output files (create if missing)
    └── YYYY-MM-DD/
        ├── daily-update.md
        └── weekly-newsletter.md     ← only on Mondays
```

---

## Primary Workflow: Daily Market Update

**Goal:** Produce a daily briefing with a header image — five global macro events, then five crypto market signals. Every item must be fresh — no story or signal may repeat from a prior day's update. Every article must include its original source URL.

### Step-by-step

1. **Search for global macro events** — Use WebSearch:
   - Query: `global markets major news [DATE]`
   - Query: `Fed FOMC [DATE]`, `oil prices geopolitics [DATE]`, `IMF trade tariffs [DATE]`
   - Query: `earnings CPI GDP trade policy [DATE]`, `central bank currency [DATE]`
   - Look for: central bank decisions, geopolitical developments, macro data releases (CPI, GDP), trade policy moves, major earnings, currency moves
   - Pick **five distinct events** — each must be a different story, covering different regions or asset classes where possible

2. **Search for crypto market signals** — Use WebSearch:
   - Query: `bitcoin exchange inflows outflows [DATE]`
   - Query: `BTC ETH open interest perpetual funding rate [DATE]`
   - Query: `whale wallet movement crypto [DATE]`
   - Query: `bitcoin ETF flows [DATE]`
   - Query: `Hyperliquid funding rate open interest BTC ETH [DATE]`
   - Query: `bitcoin ethereum key support resistance level [DATE]`
   - Acceptable sources: Glassnode, CryptoQuant, Nansen, Arkham, Coinalyze, CoinGlass, The Block, Farside, Hyperliquid native data
   - Find **five distinct signals** covering: (1) volume/derivatives, (2) whale/on-chain, (3) ETF/institutional flows, (4) Hyperliquid Desk (HL-specific funding rate, OI, perp activity), (5) technical level
   - After the five signals, add one **Regime Read** line — a single label (Trending / Choppy / High-Vol / Ranging) with a one-sentence rationale. This maps directly to which agent style is in-condition (Aurelius = Trending, Kaito = Choppy/High-Vol, Compass = Ranging/Reversal).

3. **Generate header image** — Use `mcp__nanobanana__generate_image` with this prompt structure:
   - **Style:** Bloomberg Terminal meets modern crypto UI. Deep dark background (#0d1117), mint/teal accent lines (#94f1e8), monospace typography throughout. No gradients, no glows, no emoji.
   - **Layout:** Left side — "CLYPT DAILY" wordmark in white, date in mint mono, horizontal rule, 2–3 key data pill labels from today (e.g. "BTC $80,120", "WARSH DAY 1", "REGIME: RANGING"). Right side — faint abstract candlestick chart in low-opacity teal/green and red. Bottom left — tagline (rotate daily: "Your rules trigger. The agent acts." / "Markets don't sleep. You can." / "Build your own agents. Let them trade.") in very small muted mono text.
   - **Mood:** Dense, precise, evidence-led. Pure typographic and line-based composition. Wide banner.
   - **aspect_ratio:** `16:9`
   - **model:** `normal`
   - **output_path:** `/Users/junsoopark/Documents/Marketing_Agent/_content/YYYY-MM-DD/header.png`
   - Save the image to the dated folder only — do NOT embed it in `daily-update.md`. Upload it separately to Discord as an attachment.
   - Fallback: if API quota fails, run `node _scripts/generate-header.js YYYY-MM-DD "DAY, MON DD" "LABEL1" "LABEL2" "LABEL3"` from the project root

5. **Fill the full template** — Open `_templates/daily-market-update.md`, fill all `[BRACKETED]` fields with real data. Save as `daily-update-en.md` and `daily-update-ko.md`.

6. **Write the Discord cut** — Open `_templates/daily-discord.md`. Distill today's content into the Discord format: punchy, variable sentence lengths, no markdown headers, ~150–180 words. Deliberately break perfect parallelism — mix short and longer items, lead with numbers. Save as `daily-discord-en.md` and `daily-discord-ko.md`.
   - **Price header format:** BTC and ETH must show 24h% and 7d% changes. NDX, S&P, and Dow show 24h% only. Commodities/rates (Gold, WTI, Brent, DXY, 10Y, VIX) show spot price only — no % change.
   - **Source for changes:** Fetch from CoinGecko (`include_24hr_change=true&include_7d_change=true` params) for BTC/ETH. For NDX/S&P/Dow, use the WebSearch result or a financial data source — calculate from prior close if needed.
   - **Format:** `BTC $80,120 (+2.1% 24h | +5.4% 7d)` — always show sign (+ or -), one decimal place, no spaces around the pipe.

7. **Save all output** — Four files per day in `_content/YYYY-MM-DD/`:
   - `daily-update-en.md` — full record version
   - `daily-update-ko.md`
   - `daily-discord-en.md` — Discord paste version
   - `daily-discord-ko.md`

### Quality bar
- Every number must be sourced from a credible article or named data provider — no estimates
- **No repeated stories or signals across consecutive days** — check prior day's output before finalizing; if a story is still developing, find the new angle or a different story entirely
- Section 1: five events, each a distinct story from a different source or topic area
- Section 2: five signals, each covering a different data category (derivatives, on-chain, ETF flows, Hyperliquid Desk, technical) + one Regime Read line at the end
- Every item in both sections must cite a named publication or data provider and date
- "Level to watch" must be a real structural level — SMA, EMA, prior support/resistance flip — not a round number
- No competitor names in any section
- No forward-looking price predictions ("BTC will reach...")
- Total length: 400–550 words

---

## Primary Workflow: Weekly Newsletter

**Goal:** Produce a Monday newsletter that covers last week's platform activity, AI agent highlights, market context, and curated ecosystem news.

### Step-by-step

1. **Platform updates** — Ask the user (or check internal notes if provided) what shipped last week. If no input is available, leave the Product Update section with clear `[PLACEHOLDER]` markers and flag it.

2. **AI Agent highlight** — Identify the most concrete, specific thing the AI agent surfaced last week:
   - Must include: instrument, timeframe, signal type, outcome or observation
   - Vague descriptions ("our AI found patterns") are not acceptable

3. **Market snapshot** — Pull weekly performance data for BTC, ETH, SOL via WebSearch or CoinGecko weekly endpoint. Add one macro context sentence and one on-chain signal.

4. **Strategy spotlight** — Match one strategy type from the platform to the week's dominant market condition. Tie them together with a specific rationale.

5. **Ecosystem roundup** — Use WebSearch to find 2–3 notable items from the past 7 days:
   - Query: `crypto trading research this week`, `DeFi news [DATE RANGE]`, `quant finance paper [month year]`
   - Each item needs: headline + 1-sentence summary + source name

6. **Fill the template** — Open `_templates/weekly-newsletter.md`, fill all sections. Delete internal checklist comment block.

7. **Save output** — Write to `_content/YYYY-MM-DD/weekly-newsletter.md` (date = Monday's date)

### Quality bar
- Opening line must be specific to the actual week — no generic phrasing
- Community Pulse section: only include if there's real Discord/community activity to cite
- "Coming Up" section: only list confirmed items, never speculate
- Total length: 600–900 words

---

## Brand Voice — Non-Negotiables

These rules apply to every piece of content produced in this workspace. Read `_context/brand_guidelines.md` for full details.

**Always:**
- Calm, rational, evidence-led tone
- Lead with data, follow with interpretation
- Use verified numbers only
- Refer to the platform as "ClyptAI" or "Clypt" (not "our AI", "the bot", "our platform")
- Frame strategies as tools, not guarantees

**Never:**
- "Moon", "pump", "dump", "WAGMI", "rekt", or any crypto gambling language
- Forward-looking price predictions
- Vague claims without a source ("markets are volatile today")
- Phrases like "revolutionary", "industry-first", "game-changer"
- Pressure-based copy ("don't miss out", "act now")

**Taglines available to use:**
- "Trade with AI, not at it."
- "The market doesn't sleep. You should."
- "Code becomes capital. Process becomes proof."

---

## About ClyptAI

ClyptAI is the production OS for quantitative trading — a full-stack platform combining AI-powered alpha discovery with human-driven execution. It connects pro quants (who build and verify strategies) with retail users (who subscribe and deploy them). Key differentiators:

- **Temporal Integrity Engine** — rolling-buffer architecture prevents lookahead bias; backtests use only data available at decision time
- **Verified on-chain PnL** — every live strategy is ledger-signed, not screenshots
- **Non-custodial** — funds never pass through ClyptAI
- **Zero-Gap OS** — research code deploys to production without rewrites; quants retain 100% strategy ownership
- **Full-stack** — Create → Verify → Deploy → Monetize in one platform (no competitor combines all four)

**Traction (as of seed round)**
- 500+ users, 5% paid conversion rate — zero marketing spend
- $129.7M trading volume in 1.5-month MVP
- First strategic partner signed: $30M AUM committed, go-live Q2 2026

**Business model:** SaaS subscriptions (Free / Pro $29/mo / Premium $200/mo / Enterprise), marketplace fees (2.5–20% tiered by creator volume), exchange partner rebates, institutional data licensing

**Target audience:**
- Primary: Independent quants, systematic traders, technical builders
- Secondary: Busy individual investors who want verified strategies running automatically

**Connected exchanges:** Bybit, Binance Futures, Hyperliquid, Aster, Coinbase, OKX
**Supported assets:** BTC, ETH, SOL, XRP, BNB, ADA (and others)
**Roadmap:** AI Alpha Agent (Q2 2026) → US Equities/Forex/Options (Q3) → B2B Institutional Terminal (Q4)

For full pitch deck data: `_ir_deck/clyptai-seed-deck.md`
For product, pricing, and positioning details: `_context/business_context.md`

---

## Tools Available

| Tool | Use case |
|------|----------|
| `WebSearch` | News search, price lookup, research finding |
| `WebFetch` | Fetch CoinGecko API, fetch specific article URLs |
| `Write` | Save finished content files |
| `Read` | Read templates before filling them |
| `mcp__nanobanana__generate_image` | Generate visuals for newsletter headers or social assets |

**CoinGecko endpoints (no API key required):**
```
# Current prices
https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple,cardano&vs_currencies=usd&include_24hr_change=true&include_7d_change=true

# Market data (volume, market cap)
https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana&order=market_cap_desc
```

---

## Conventions

- **File naming:** Always produce four files per daily update: `daily-update-en.md`, `daily-update-ko.md`, `daily-discord-en.md`, `daily-discord-ko.md`. Newsletters: `weekly-newsletter-en.md`, `weekly-newsletter-ko.md`
- **Discord cut rules:** No markdown headers (#). No citation format at end of each item. Variable sentence lengths — deliberately break parallel structure. Under 180 words. No tagline at the end
- **Date folders:** `_content/YYYY-MM-DD/` — use ISO format, always the publish date
- **Brackets:** All `[BRACKETED]` fields must be filled before a file is considered done. Never leave a bracket in final output.
- **Comment blocks:** Strip all `<!-- ... -->` comment blocks from final output files
- **Sources:** When citing a specific article, include publication name in the text. Full URLs are optional.
- **Numbers:** Always include the unit (%, $, BTC, etc.). Use comma separators for numbers ≥1,000.
- **Timestamps:** Use EST for all times in published content (team is based in New York).

---

## Asking for Missing Information

If product update details, Discord activity, or internal data are needed and not provided, do not fabricate or use placeholder text in final output. Instead:
1. Generate all other sections completely
2. Mark missing sections clearly with `[NEEDS INPUT: description of what's needed]`
3. Note at the top of the file what's outstanding

Do not block the entire draft waiting for one section.
