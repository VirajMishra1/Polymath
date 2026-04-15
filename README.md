# Polymath

A professional-grade terminal interface for analyzing Polymarket prediction markets. Built with Next.js 15, featuring real-time market data, AI-powered analysis, Monte Carlo simulations, and portfolio risk management tools.

**Live Demo:** [https://polymath-tau.vercel.app/](https://polymath-tau.vercel.app/)

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### Market Data
- **Live Events Dashboard** — Browse active Polymarket events with real-time volume, liquidity, and pricing from the Gamma API
- **Market Terminal** — Price history charts, orderbook depth visualization, and live price feeds via the CLOB API
- **Search & Filtering** — Find markets by category (Politics, Sports, Crypto, Pop Culture, Business, Science)
- **Keyboard Navigation** — Terminal-style shortcuts: `/` to search, `J/K` to navigate, `Enter` to select, `P` for portfolio

### Analysis Tools

#### Technical Analysis (Gemini 2.5 Flash)
- Direction prediction (YES / NO / NEUTRAL) with confidence scores
- Technical signal detection: SMA crossovers, RSI, momentum, order book imbalance
- Reasoning explanation based on detected signals

#### Math Prediction Suite

**Monte Carlo Simulation**
- 500 simulation paths using Geometric Brownian Motion (GBM) with Box-Muller transform
- Price distribution with percentile bands (5th, 25th, 50th, 75th, 95th)
- Visual paths showing best, worst, and median trajectories
- Probability of price going up or down

**Scenario Analysis**
- P&L across price shocks from -30¢ to +30¢
- Visual bar chart of profit/loss at each price point

**Hedge Recommendations**
- Delta hedge, collar strategy, and volatility hedge options
- Cost and risk reduction estimates per strategy

### Portfolio Management
- Add YES/NO positions with custom quantity and entry price
- Aggregate payoff curve across all positions
- Risk metrics: total P&L, Value at Risk (95%), Sharpe ratio, net delta, win rate
- External crypto hedge tracking (ETH, BTC, SOL) with live prices from CoinGecko

### News
- Google News RSS feed for any market query — no API key required
- AI-powered article summarization via Gemini
- Scrolling news ticker with sentiment indicators

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom terminal theme
- **State Management**: Zustand with localStorage persistence
- **Charts**: Custom SVG + Recharts
- **UI Components**: Radix UI primitives
- **Data**: Polymarket Gamma API + CLOB API (public, no auth required)
- **AI**: Google Gemini 2.5 Flash
- **News**: Google News RSS (free)
- **Crypto Prices**: CoinGecko free API

## Setup

### Prerequisites
- Node.js 18+

### Install & Run

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`

### Environment Variables

Create a `.env.local` file:

```env
GEMINI_API_KEY=your_gemini_api_key
```

The Gemini key is only required for AI analysis and news summarization. All market data features work without it.

## API Routes

All API routes are Next.js server-side:

| Route | Description |
|-------|-------------|
| `GET /api/events` | List active Polymarket events |
| `GET /api/events/[id]` | Event details + markets |
| `GET /api/markets/[id]` | Market data, orderbook, price history |
| `POST /api/analysis` | Run technical analysis + Monte Carlo |
| `GET /api/news` | Fetch Google News RSS for a query |
| `POST /api/news/summarize` | Summarize article via Gemini |
| `GET /api/price-events` | Detect significant price movements |

## Mathematical Models

### Monte Carlo (GBM)
```
S_t = S_0 × (1 + μΔt + σ√Δt × Z)

Where:
- S_0 = Current price
- μ  = Drift (annualized mean return from price history)
- σ  = Volatility (annualized daily volatility)
- Z  = Standard normal via Box-Muller transform
- Prices clamped to [0.01, 0.99]
```

### Scenario Analysis
```
For each shock in [-30¢, -20¢, -10¢, -5¢, 0, +5¢, +10¢, +20¢, +30¢]:
  new_price = clamp(current_price + shock, 0.01, 0.99)
  pnl = position_size × (new_price - entry_price)
```

### Payoff Curve
```
YES position: P&L = quantity × (outcome_price - entry_price)
NO position:  P&L = quantity × ((1 - outcome_price) - (1 - entry_price))
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Open search |
| `J` | Navigate down |
| `K` | Navigate up |
| `Enter` | Select / Open |
| `P` | Go to Portfolio |
| `Esc` | Go back / Close modal |

## License

MIT — free for personal or commercial use.

## Disclaimer

For educational and informational purposes only. Not financial advice. Trading prediction markets involves risk of loss.
