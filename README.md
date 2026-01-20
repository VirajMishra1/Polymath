# Poly-Terminal

A professional-grade terminal interface for analyzing and trading on Polymarket prediction markets. Built with Next.js 15 and FastAPI, featuring real-time data, AI-powered analysis, Monte Carlo simulations, and advanced risk management tools.

**Live Demo:** [https://polymath-tau.vercel.app/](https://polymath-tau.vercel.app/)

![Poly-Terminal](https://img.shields.io/badge/version-1.0.0-green) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688) ![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### Market Data & Browsing
- **Live Events Dashboard** - Browse active Polymarket events with real-time volume, liquidity, and pricing
- **Market Details** - Deep dive into individual markets with orderbook visualization and price history charts
- **Search & Filtering** - Find markets by category (Politics, Sports, Crypto, Pop Culture, Business, Science)
- **Keyboard Navigation** - Terminal-style navigation with `/` to search, `J/K` to navigate, `Enter` to select

### Analysis Tools

#### AI Analysis (Wood Wide AI)
- Neural network-based market prediction
- Sentiment analysis with confidence scores
- Technical signal detection (momentum, RSI, volatility, order imbalance)
- Token compression via The Token Company API for cost-efficient LLM calls

#### Math Prediction Suite

**1. Monte Carlo Simulation**
- Runs 500 simulations using Geometric Brownian Motion (GBM)
- Calculates price distribution with percentile bands (5th, 25th, 50th, 75th, 95th)
- Visual simulation paths showing best, worst, and median trajectories
- Probability of price movement (P(Up), P(Down))

**2. Scenario Analysis**
- What-if analysis across price shock levels (-20¢ to +20¢)
- P&L calculations at each price point
- Visual bar chart of profit/loss distribution

**3. Hedge Recommendations**
- Identifies correlated markets within the same event
- Calculates optimal hedge ratios based on correlation proxies
- Risk reduction estimates and suggested position sizes

### Portfolio Management

**Position Builder**
- Add YES/NO positions with custom quantity and entry price
- Track multiple positions across different markets
- Real-time P&L calculations

**Risk Analytics**
- Total portfolio value and unrealized P&L
- Value at Risk (VaR) at 95% confidence
- Win rate and Sharpe ratio calculations
- Net delta exposure

**Payoff Curve**
- Visual P&L diagram showing profit/loss at every outcome price (0¢ to 100¢)
- Time decay curves at different time horizons (7d, 14d, 21d, at expiry)
- Breakeven point detection
- Max profit/loss calculations

**Time Decay (Timing) Analysis**
- Resolution timing scenarios
- Expected P&L at different time horizons
- Best/worst case projections
- Theta decay visualization

**External Hedge Integration**
- Hedge Polymarket exposure with crypto assets (ETH, BTC, SOL)
- Correlation estimates based on market question analysis
- Leverage support (1x to 10x)
- Track external hedge P&L alongside market positions

### News & Sentiment
- Real-time news ticker with market-relevant articles
- Price event analysis with article attribution
- Sentiment classification (bullish, bearish, neutral)

### Live News Aggregation & Betting Signals
The system aggregates real-time news from multiple sources (Tavily, Reddit, Google News) and analyzes them to generate actionable betting recommendations:

- **Multi-Source News Aggregation** - Pulls latest news articles related to each market from Tavily API, Reddit discussions, and web sources
- **AI-Powered Sentiment Analysis** - Each news article is analyzed for sentiment (bullish/bearish/neutral) and relevance to the market
- **Betting Signal Generation** - Based on aggregated news sentiment, the AI generates:
  - **Direction**: BUY YES, BUY NO, or HOLD
  - **Confidence Score**: 0-100% confidence in the recommendation
  - **Reasoning**: Explanation of why the news supports the recommendation
- **Price Impact Detection** - Identifies which news articles likely caused recent price movements
- **News Ticker** - Real-time scrolling ticker showing latest market-relevant headlines with sentiment indicators

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 with custom terminal theme
- **State Management**: Zustand
- **Charts**: Custom SVG + Recharts
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Data Processing**: NumPy, Pandas, SciPy
- **External APIs**: Polymarket Gamma API, Polymarket CLOB API
- **AI/LLM**: Google Gemini, Wood Wide API
- **News Sources**: Tavily API, Reddit API

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/                    # Next.js API routes (proxy to backend)
│   │   │   ├── analysis/           # AI/Math analysis endpoints
│   │   │   ├── events/             # Event listing and details
│   │   │   ├── markets/            # Market data and orderbooks
│   │   │   ├── news/               # News aggregation
│   │   │   └── price-events/       # Price movement analysis
│   │   ├── event/[id]/             # Event detail page
│   │   ├── market/[id]/            # Market detail page with analysis
│   │   ├── portfolio/              # Portfolio management page
│   │   └── page.tsx                # Dashboard/home page
│   ├── components/
│   │   ├── charts/
│   │   │   ├── payoff-curve.tsx    # P&L payoff visualization
│   │   │   └── price-chart.tsx     # Price history chart
│   │   ├── external-hedge-panel.tsx # Crypto hedge integration
│   │   ├── news-ticker.tsx         # News feed component
│   │   ├── orderbook.tsx           # Order book visualization
│   │   ├── position-builder.tsx    # Position entry form
│   │   ├── search-bar.tsx          # Market search
│   │   └── time-decay-visualizer.tsx # Time decay analysis
│   ├── hooks/                      # Custom React hooks
│   └── lib/
│       ├── portfolio-store.ts      # Zustand portfolio state
│       ├── store.ts                # Global app state
│       ├── types.ts                # TypeScript types
│       └── utils.ts                # Utility functions
├── backend/
│   ├── app/
│   │   ├── analysis/               # Analysis pipeline
│   │   ├── compress/               # Token compression
│   │   ├── llm/                    # LLM integrations
│   │   ├── polymarket/
│   │   │   ├── gamma.py            # Gamma API client
│   │   │   └── clob.py             # CLOB API client
│   │   ├── risk/
│   │   │   ├── montecarlo.py       # Monte Carlo simulator
│   │   │   ├── scenario.py         # Scenario analyzer
│   │   │   ├── hedge.py            # Hedge recommender
│   │   │   └── liquidity.py        # Liquidity metrics
│   │   ├── sources/                # News/data sources
│   │   ├── storage/                # State management
│   │   ├── config.py               # Environment config
│   │   ├── main.py                 # FastAPI app
│   │   └── models.py               # Pydantic models
│   └── requirements.txt            # Python dependencies
├── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js 18+ and npm/bun
- Python 3.11+
- Redis (optional, for caching)

### Frontend Setup

```bash
# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## Environment Variables

### Backend (.env)
```env
# Polymarket APIs (no auth required)
POLYMARKET_GAMMA_URL=https://gamma-api.polymarket.com
POLYMARKET_CLOB_URL=https://clob.polymarket.com

# Optional: News & Analysis APIs
TAVILY_API_KEY=your_tavily_key           # News search
REDDIT_CLIENT_ID=your_reddit_id          # Reddit integration
REDDIT_CLIENT_SECRET=your_reddit_secret
TOKEN_COMPANY_API_KEY=your_token_key     # Token compression
GEMINI_API_KEY=your_gemini_key           # Google Gemini AI
WOODWIDE_API_KEY=your_woodwide_key       # Wood Wide AI

# Optional: Redis caching
REDIS_URL=redis://localhost:6379/0

# Server config
DEBUG=true
PORT=8000
HOST=0.0.0.0
```

## API Reference

### Events
- `GET /api/events` - List active events
- `GET /api/events/{id}` - Get event details
- `GET /api/events/{id}/markets` - Get event markets

### Markets
- `GET /api/markets/{id}` - Get market details
- `GET /api/markets/{id}/snapshot` - Get live market snapshot
- `GET /api/markets/{id}/orderbook` - Get orderbook depth
- `GET /api/markets/{id}/timeseries` - Get price history

### Analysis
- `POST /api/analysis` - Run AI/Math analysis
- `GET /api/analysis/{id}` - Get analysis results

### Risk Tools
- `POST /api/risk/scenario` - Compute scenario P&L
- `POST /api/risk/montecarlo` - Run Monte Carlo simulation
- `GET /api/risk/liquidity/{id}` - Get liquidity metrics
- `POST /api/risk/hedge` - Get hedge recommendations

## Mathematical Models

### Monte Carlo Simulation
Uses Geometric Brownian Motion (GBM) to simulate future price paths:

```
S_t = S_0 × exp((μ - 0.5σ²)t + σ√t × Z)

Where:
- S_t = Price at time t
- S_0 = Current price
- μ = Drift (assumed 0 for prediction markets)
- σ = Volatility (calculated from historical hourly returns)
- Z = Standard normal random variable
```

### Scenario Analysis
Calculates P&L across price shocks:

```
For each shock in [-20¢, -10¢, -5¢, 0, +5¢, +10¢, +20¢]:
  new_price = current_price + shock
  pnl = position_size × (new_price - entry_price)
  pnl_percent = pnl / (position_size × entry_price) × 100
```

### Payoff Curve
Calculates profit/loss at every possible outcome price:

```
For YES position:
  P&L = quantity × (outcome_price - entry_price)

For NO position:
  P&L = quantity × ((1 - outcome_price) - (1 - entry_price))
```

### Time Decay (Theta)
Models value erosion as expiry approaches:

```
time_value = intrinsic_value × √(days_remaining / total_days)
decay_factor = √(days_remaining / total_days)
```

### Hedge Correlation
Estimates correlation between prediction market and crypto assets:

```
base_correlation = 
  0.7-0.85 for crypto-related markets
  0.2-0.4 for non-crypto markets

hedge_ratio = correlation × (position_delta / hedge_volatility)
risk_reduction = hedge_ratio × correlation × 100%
```

## Usage Guide

### 1. Browse Markets
- Navigate to the dashboard to see live events
- Filter by category or use `/` to search
- Click an event to see its markets

### 2. Analyze a Market
- Open a market to see price chart and orderbook
- Click "Run AI Analysis" for Wood Wide AI prediction
- Click "Run Math Analysis" for Monte Carlo/Scenario/Hedge

### 3. Build Positions
- Use the Position Builder to add YES/NO positions
- Set quantity and entry price
- Positions are saved locally and persist

### 4. Review Portfolio
- Navigate to Portfolio (press `P`)
- See aggregate payoff curve and risk metrics
- Add external crypto hedges if desired

### 5. Monitor Time Decay
- Check the Timing tab to see resolution scenarios
- Understand how early/late resolution affects P&L

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Open search |
| `J` | Navigate down |
| `K` | Navigate up |
| `Enter` | Select/Open |
| `P` | Go to Portfolio |
| `Esc` | Go back / Close modal |

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Disclaimer

This tool is for educational and informational purposes only. It is not financial advice. Trading prediction markets involves risk of loss. Always do your own research before making trading decisions.
