# PolyRisk Terminal - Demo Plan

## Project Overview (30 seconds)
**PolyRisk Terminal** is a TradFi-style risk analysis platform for Polymarket prediction markets. We bring professional derivatives trading tools to the prediction market space—the same payoff curves, scenario analysis, and risk metrics you'd find on Bloomberg Terminal or Options Profit Calculator, but built specifically for binary outcome markets.

---

## Demo Flow (5-7 minutes)

### 1. Dashboard - Live Market Discovery (45 seconds)
**Route: `/`**

**What to show:**
- Live events pulled from Polymarket's Gamma API (not mock data)
- Real-time volume, liquidity, and market counts
- Category filtering (Politics, Sports, Crypto, etc.)
- Hot/Ending soon badges based on volume thresholds
- Search bar with live Polymarket data search

**Talking points:**
- "Everything you see is live from Polymarket—real prices, real volume, real liquidity"
- "We pull from the Gamma API and refresh every 60 seconds"
- "Search actually queries Polymarket's market database"

---

### 2. Event View - Multi-Market Events (30 seconds)
**Route: `/event/[id]`**

**What to show:**
- Click any event (e.g., a political event with multiple markets)
- Show all related markets under one event
- Aggregate volume/liquidity across markets

**Talking points:**
- "Events group related markets—useful for seeing the full picture"
- "Each market is a separate binary outcome you can analyze"

---

### 3. Market Terminal - The Core Product (2-3 minutes)
**Route: `/market/[id]`**

**What to show:**

#### A. Price Chart with Interactive Analysis
- Historical price data with tooltips
- Price dips/spikes detection (click to see AI explanation)
- Real orderbook depth visualization

#### B. Position Builder (Right Panel - "Trade" Tab)
- Select YES or NO side
- Set quantity and entry price
- **Live P&L preview**: Cost, max profit, max loss, breakeven, ROI
- "Add to Portfolio" saves to local state

**Demo this:**
1. Select YES with 500 shares at current market price
2. Show the instant calculation: "If I buy 500 YES at 65¢, my cost is $325, max profit is $175 (54% ROI), max loss is $325"
3. Add it to portfolio

#### C. Payoff Curve (Right Panel - "Payoff" Tab)
- Interactive payoff diagram across all possible outcomes (0-100¢)
- **Time decay visualization**: Shows P&L at different days to expiry (7d, 14d, 21d, at expiry)
- Multiple positions aggregate on the same chart

**Demo this:**
- "This is like an options payoff diagram but for prediction markets"
- "The colored lines show how your P&L changes as time passes—prediction markets have time value too"

#### D. Time Decay Visualizer (Right Panel - "Timing" Tab)
- Theta decay table showing value erosion over time
- Days to breakeven calculation
- Resolution timing impact

#### E. External Hedge Integration (Right Panel - "Hedge" Tab)
- **Crypto correlation display**: ETH, BTC, SOL with estimated correlations to the market
- Auto-detected correlations based on market question (crypto markets show higher correlation)
- **Hedge recommendations**: "If you're long this crypto prediction, short ETH as a hedge"
- Manual hedge position builder with leverage support

**Demo this:**
- "If this is a 'Will ETH hit $5000' market, we detect that and show 85% correlation to ETH"
- "The system recommends: SHORT 0.1 ETH at 2x leverage to reduce your risk by 40%"

---

### 4. AI & Mathematical Analysis (1-2 minutes)

#### A. AI Analysis (Wood Wide AI)
- Click "Run AI Analysis"
- Show the calculating modal with animation
- **Results include:**
  - Direction prediction (YES/NO/NEUTRAL)
  - Probability and confidence scores
  - Technical signals (SMA crossovers, RSI, momentum, order imbalance)
  - Reasoning explanation
  - **Token compression stats** (powered by The Token Company)

**Demo this:**
- "We use Wood Wide AI for numeric reasoning on market data"
- "The Token Company compresses our prompts by ~40%—you can see the token savings right here"

#### B. Math Prediction (Monte Carlo)
- Switch to "Math Prediction" and run analysis
- **Monte Carlo Simulation:**
  - 500 simulation paths visualized
  - Best/worst/median paths on chart
  - Distribution stats: mean, percentiles, P(Up), P(Down)
- **Scenario Analysis:**
  - P&L across different price shocks (-30¢ to +30¢)
  - Visual bar chart of outcomes
- **Hedge Strategies:**
  - Delta hedge, collar strategy, volatility hedge recommendations
  - Correlated markets with optimal hedge ratios

**Demo this:**
- "This runs 500 Monte Carlo simulations using Geometric Brownian Motion"
- "You can see the distribution of outcomes—5th percentile to 95th percentile"
- "The hedge tab shows three strategies with cost/risk reduction tradeoffs"

---

### 5. Portfolio Dashboard (1 minute)
**Route: `/portfolio`**

**What to show:**
- Aggregate view of all positions across markets
- **Risk metrics**: Total value, unrealized P&L, VaR (95%), win rate, Sharpe ratio
- **Aggregate payoff curve** across all positions
- **Portfolio allocation** pie breakdown
- **External hedges** tracked alongside prediction market positions
- Max profit/loss across entire portfolio

**Demo this:**
1. Show the positions you added earlier
2. "Here's my aggregate exposure across all markets"
3. "VaR tells me at 95% confidence, my max daily loss is $X"
4. "I can see my net delta—am I overall bullish or bearish?"

---

## Technical Highlights to Mention

### Real Data Integration
- Polymarket Gamma API for live markets, events, prices
- Real orderbook data
- Historical price timeseries

### Sponsor Integrations
- **Wood Wide AI**: Numeric reasoning model for market prediction
- **The Token Company**: Prompt compression (~35-50% token reduction)

### Risk Analysis Features
- Monte Carlo simulation (Geometric Brownian Motion)
- Scenario/stress testing across price shocks
- Time decay modeling for binary outcomes
- Multi-asset hedge recommendations

### UX Polish
- Terminal aesthetic (monospace fonts, green-on-black)
- Keyboard shortcuts (/, J/K, Enter, Esc, P)
- Real-time updates with auto-refresh
- Mobile-responsive design

---

## Q&A Preparation

**"How accurate is the AI prediction?"**
> The AI provides a signal, not a guarantee. It analyzes technical indicators like momentum, RSI, and orderbook imbalance. The confidence score tells you how strong the signal is.

**"Can you actually trade?"**
> This is a paper trading/analysis tool. We don't execute trades—we help you understand your risk before you trade on Polymarket directly.

**"How do the crypto hedges work?"**
> We estimate correlation between prediction markets and crypto assets based on the market question. If you're betting on a crypto outcome, hedging with the underlying asset reduces your risk.

**"Why time decay on prediction markets?"**
> Prediction markets have implied time value. A 65¢ position expiring tomorrow is worth more than the same position expiring in 6 months because there's less uncertainty to resolve.

---

## Demo Checklist

- [ ] Dashboard loads with live Polymarket data
- [ ] Search returns real markets
- [ ] Event page shows multiple markets
- [ ] Market terminal shows real price history
- [ ] Position builder calculates correct P&L
- [ ] Payoff curve renders with time decay lines
- [ ] AI analysis runs and shows results
- [ ] Monte Carlo simulation visualizes paths
- [ ] Portfolio aggregates multiple positions
- [ ] External hedge panel shows correlations
