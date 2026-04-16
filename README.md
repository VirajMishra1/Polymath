# Polymath

Bloomberg Terminal–style interface for Polymarket prediction markets — real-time data, cross-market analytics, and AI-assisted research. Built with Next.js 15 on Vercel.

**Live:** [polymath-app.vercel.app](https://polymath-app.vercel.app/)

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## What's in it

### Market browsing
- **Dashboard** — active events from Polymarket's Gamma API, sorted by volume, filterable by category (Politics, Sports, Crypto, Pop Culture, Business, Science).
- **Market terminal** (`/market/[id]`) — price history (1D/1W/1M), live orderbook with depth bars, top bid/ask/spread, outcome pricing, news ticker, and a per-market AI analysis panel.
- **Event view** (`/event/[slug]`) — groups all markets under a single event (e.g. "Who wins 2026 Champions League?") with shared metadata. Works from both numeric IDs and slugs.
- **Keyboard-first navigation** — `/` to search, `J/K` to navigate, `Enter` to select, `P` for portfolio, `Esc` to go back.

### Cross-market analytics
- **Arbitrage scanner** (`/arbitrage`) — scans the top 80 multi-outcome events and flags those whose YES prices sum to more or less than 100¢ by ≥2%. Ranked by `|arbPct| × √liquidity` so tradeable edges surface above mid-priced noise.
- **Correlation matrix** (`/correlation`) — paste 2–6 market IDs, computes pairwise Pearson correlation on 1-week price history aligned by timestamp. Flags mispriced pairs where correlation ≥ 0.70 but the current price ratio has drifted ≥15% from the historical mean.
- **Rolling correlation + decoupling detection** — on the same page, sliding-window Pearson (1/3 of series, clamped 5–24 samples) rendered as per-pair sparklines. Pairs where the recent window has broken >0.30 below the overall correlation get a `DECOUPLING` badge — often a regime change or pair-trade revert opportunity.
- **Resolution calendar** (`/resolutions`) — events whose `endDate` falls within a 1-to-30-day horizon, bucketed into 24h / 3d / 7d / 14d / 30d bands, sorted by volume within each bucket. Shows where event risk is about to hit.
- **Market movers** (`/movers`) — largest 24h price movers, each with a one-sentence Gemini-generated "why" explanation grounded in scraped Google News headlines.

### Per-market AI analysis
Two independent analysis modes plus a digest:

| Mode | What it does |
|------|--------------|
| **Technical Analysis** | Gemini reads price history + orderbook, outputs direction (YES/NO/NEUTRAL), confidence, and detected signals (SMA crossovers, RSI, momentum, book imbalance). |
| **Math Prediction** | 500-path Monte Carlo via Geometric Brownian Motion (Box-Muller), scenario analysis from −30¢ to +30¢, and a payoff curve for the user's position. |
| **News Signal** | Pulls recent headlines from Google News, asks Gemini to estimate the implied probability, compares to market price, and labels OVERPRICED / UNDERPRICED / FAIRLY_PRICED with per-headline sentiment. 10-min in-memory cache. |
| **News Digest · 30d** | Google News over a 30-day window, synthesized by Gemini into: narrative summary, net direction, weighted key themes, chronological timeline of significant headlines, and forward-looking catalysts. 30-min cache. |

### Trading tools on the market page
- **Slippage calculator** — takes a $ order size, walks the live orderbook, returns avg fill price, shares acquired, levels consumed, and slippage in bps. Warns on book exhaustion or ≥200bps slippage.
- **Position builder** — YES/NO, quantity, entry price → payoff curve and P&L math.
- **Time-decay visualizer** — theta-like decay curve for price-in-the-money positions as resolution approaches.

### Portfolio
- Add YES/NO positions with custom quantity and entry price.
- Live price refresh on mount (can also be manually refreshed).
- Aggregate payoff curve across all positions.
- **Real risk metrics** — parametric Value at Risk for binary outcomes: `VaR₉₅ = 1.645 × √(Σ qᵢ² · pᵢ · (1 − pᵢ))`, plus net exposure and per-position P&L using the refreshed price.
- Close selected positions.
- Persisted in `localStorage` via Zustand.

### LLM routing
Primary provider is Gemini 2.5 (`gemini-2.5-flash-lite` first, then `gemini-2.5-flash` on 429/503). On full Gemini failure, it falls back to **Groq + Llama 3.3 70B**. Timeouts (15s) and cache on every LLM-driven endpoint to protect free-tier quota.

---

## Tech

- **Framework**: Next.js 15 (App Router, Turbopack, Fluid Compute on Vercel)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS + custom terminal/CRT theme
- **State**: Zustand with `persist` (localStorage)
- **Charts**: hand-rolled SVG + Recharts
- **UI primitives**: Radix UI + lucide-react
- **Market data**: Polymarket Gamma API + CLOB API (public, no auth)
- **LLMs**: Google Gemini 2.5 (primary) · Groq Llama 3.3 70B (fallback)
- **News**: Google News RSS (no key)
- **Deployment**: Vercel

No backend service — every route is a Next.js server function. The Polymarket APIs and LLM providers are called directly from server code.

---

## Setup

```bash
npm install
cp .env.example .env.local   # fill in keys
npm run dev
```

`.env.local`:
```env
GEMINI_API_KEY=...      # required for AI features; get one at aistudio.google.com/apikey
GROQ_API_KEY=...        # optional fallback; get at console.groq.com/keys
```

All market-data features work without keys — AI-driven features degrade gracefully (show raw headlines or disabled analysis) when both are absent.

---

## API routes

| Route | Purpose |
|-------|---------|
| `GET /api/events` | List active events (paginated, volume-sorted) |
| `GET /api/events/[id]` | Event details — accepts numeric ID or slug |
| `GET /api/markets` | List active markets |
| `GET /api/markets/[id]` | Market + orderbook + price history |
| `POST /api/analysis` | Technical analysis + Monte Carlo |
| `POST /api/news-signal` | Per-market news-vs-price gap signal |
| `POST /api/news-digest` | 30-day narrative digest |
| `POST /api/correlation` | Pearson matrix + mispriced pairs + rolling series |
| `GET /api/arbitrage` | Cross-market arbitrage scanner |
| `GET /api/resolutions?days=N` | Events resolving within N days |
| `GET /api/movers` | Top 24h movers with AI-generated "why" |
| `GET /api/news` | Google News RSS for a query |
| `POST /api/news/summarize` | Summarize an article |
| `GET /api/price-events` | Significant historical price-event detection |

---

## Math reference

### Monte Carlo (GBM)
```
S_{t+1} = S_t · (1 + μΔt + σ√Δt · Z)
Z  ~ N(0, 1)     via Box-Muller
μ  = annualized mean log-return from price history
σ  = annualized daily volatility
S  clamped to [0.01, 0.99]   (binary-outcome boundary)
500 paths, percentiles at 5/25/50/75/95
```

### Portfolio VaR (parametric, binary)
```
VaR₉₅ = 1.645 · √( Σ qᵢ² · pᵢ · (1 − pᵢ) )
```
Where `qᵢ` is position size and `pᵢ` is current market price. Treats each market as an independent Bernoulli outcome. Real positions are not fully independent, but this is a defensible baseline for a multi-market book.

### Pearson correlation
```
ρ(X,Y) = Σ(xᵢ − x̄)(yᵢ − ȳ) / √( Σ(xᵢ − x̄)² · Σ(yᵢ − ȳ)² )
```
Series aligned by timestamp first; falls back to positional alignment if <3 common timestamps.

### Arbitrage detection
```
For any event with ≥3 mutually-exclusive YES markets:
  sum = Σ priceᵢ
  if |sum − 1.00| ≥ 0.02:  flag
  rank by |arb| · √liquidity
```

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `/` | Open search |
| `J` / `K` | Navigate list down/up |
| `Enter` | Select / open |
| `P` | Portfolio |
| `Esc` | Back / close modal |

---

## What this is not

- **Not** a trading client. Positions are local-only. No wallet integration, no order submission.
- **Not** financial advice. Backtests and AI outputs are exploratory tooling, not signals to act on.
- **Not** fully real-time. Prices are polled, not streamed; orderbook updates on page load.

## License

MIT.
