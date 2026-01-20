import type {
  Event,
  Market,
  MarketSnapshot,
  Orderbook,
  Timeseries,
  LiquidityData,
  AnalysisResult,
  ScenarioResult,
  MonteCarloResult,
  HedgeResult,
} from './types';

export const mockEvents: Event[] = [
  {
    id: 'evt-1',
    title: '2024 US Presidential Election',
    slug: '2024-us-presidential-election',
    description: 'Who will win the 2024 United States Presidential Election?',
    category: 'Politics',
    volume: 450000000,
    liquidity: 12500000,
    end_date: '2024-11-05T23:59:59Z',
    created_at: '2023-01-15T00:00:00Z',
    markets_count: 8,
    image_url: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=400',
  },
  {
    id: 'evt-2',
    title: 'Fed Interest Rate Decision',
    slug: 'fed-interest-rate-december-2024',
    description: 'What will the Federal Reserve decide on interest rates?',
    category: 'Economics',
    volume: 85000000,
    liquidity: 3200000,
    end_date: '2024-12-18T19:00:00Z',
    created_at: '2024-09-01T00:00:00Z',
    markets_count: 4,
    image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
  },
  {
    id: 'evt-3',
    title: 'Bitcoin Price End of Year',
    slug: 'bitcoin-price-eoy-2024',
    description: 'What will be the price of Bitcoin at the end of 2024?',
    category: 'Crypto',
    volume: 120000000,
    liquidity: 5800000,
    end_date: '2024-12-31T23:59:59Z',
    created_at: '2024-01-01T00:00:00Z',
    markets_count: 6,
    image_url: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400',
  },
  {
    id: 'evt-4',
    title: 'Super Bowl LVIII Winner',
    slug: 'super-bowl-lviii-winner',
    description: 'Which team will win Super Bowl LVIII?',
    category: 'Sports',
    volume: 95000000,
    liquidity: 4100000,
    end_date: '2024-02-11T23:59:59Z',
    created_at: '2023-09-01T00:00:00Z',
    markets_count: 3,
    image_url: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400',
  },
  {
    id: 'evt-5',
    title: 'AI Regulation in EU',
    slug: 'eu-ai-act-passage',
    description: 'Will the EU AI Act be fully implemented by 2025?',
    category: 'Technology',
    volume: 32000000,
    liquidity: 1500000,
    end_date: '2025-01-01T00:00:00Z',
    created_at: '2024-03-15T00:00:00Z',
    markets_count: 2,
    image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
  },
];

export const mockMarkets: Record<string, Market[]> = {
  'evt-1': [
    {
      id: 'mkt-1',
      event_id: 'evt-1',
      question: 'Will the Democratic candidate win?',
      outcome_yes: 'Democratic Win',
      outcome_no: 'Republican Win',
      price_yes: 0.48,
      price_no: 0.52,
      volume: 180000000,
      liquidity: 5200000,
      end_date: '2024-11-05T23:59:59Z',
      status: 'active',
    },
    {
      id: 'mkt-2',
      event_id: 'evt-1',
      question: 'Will the Republican candidate win?',
      outcome_yes: 'Republican Win',
      outcome_no: 'Other',
      price_yes: 0.52,
      price_no: 0.48,
      volume: 175000000,
      liquidity: 5100000,
      end_date: '2024-11-05T23:59:59Z',
      status: 'active',
    },
    {
      id: 'mkt-3',
      event_id: 'evt-1',
      question: 'Will popular vote match electoral college?',
      outcome_yes: 'Match',
      outcome_no: 'Split',
      price_yes: 0.72,
      price_no: 0.28,
      volume: 45000000,
      liquidity: 1200000,
      end_date: '2024-11-05T23:59:59Z',
      status: 'active',
    },
  ],
  'evt-2': [
    {
      id: 'mkt-4',
      event_id: 'evt-2',
      question: 'Will the Fed cut rates by 25bps?',
      outcome_yes: 'Cut 25bps',
      outcome_no: 'Other',
      price_yes: 0.65,
      price_no: 0.35,
      volume: 42000000,
      liquidity: 1800000,
      end_date: '2024-12-18T19:00:00Z',
      status: 'active',
    },
    {
      id: 'mkt-5',
      event_id: 'evt-2',
      question: 'Will the Fed hold rates unchanged?',
      outcome_yes: 'Hold',
      outcome_no: 'Change',
      price_yes: 0.25,
      price_no: 0.75,
      volume: 28000000,
      liquidity: 900000,
      end_date: '2024-12-18T19:00:00Z',
      status: 'active',
    },
  ],
  'evt-3': [
    {
      id: 'mkt-6',
      event_id: 'evt-3',
      question: 'Will Bitcoin exceed $100,000?',
      outcome_yes: 'Above $100K',
      outcome_no: 'Below $100K',
      price_yes: 0.42,
      price_no: 0.58,
      volume: 65000000,
      liquidity: 3200000,
      end_date: '2024-12-31T23:59:59Z',
      status: 'active',
    },
  ],
};

export function generateMockSnapshot(marketId: string): MarketSnapshot {
  const basePrice = 0.3 + Math.random() * 0.4;
  return {
    market_id: marketId,
    price_yes: basePrice,
    price_no: 1 - basePrice,
    volume_24h: Math.floor(Math.random() * 5000000),
    volume_total: Math.floor(Math.random() * 100000000),
    liquidity: Math.floor(Math.random() * 5000000),
    open_interest: Math.floor(Math.random() * 10000000),
    last_trade_price: basePrice + (Math.random() - 0.5) * 0.02,
    last_trade_time: new Date().toISOString(),
    price_change_24h: (Math.random() - 0.5) * 0.1,
    price_change_7d: (Math.random() - 0.5) * 0.2,
  };
}

export function generateMockOrderbook(marketId: string): Orderbook {
  const midPrice = 0.3 + Math.random() * 0.4;
  const bids: { price: number; size: number; total: number }[] = [];
  const asks: { price: number; size: number; total: number }[] = [];
  
  let bidTotal = 0;
  let askTotal = 0;
  
  for (let i = 0; i < 25; i++) {
    const bidSize = Math.floor(1000 + Math.random() * 10000);
    bidTotal += bidSize;
    bids.push({
      price: midPrice - 0.001 * (i + 1),
      size: bidSize,
      total: bidTotal,
    });
    
    const askSize = Math.floor(1000 + Math.random() * 10000);
    askTotal += askSize;
    asks.push({
      price: midPrice + 0.001 * (i + 1),
      size: askSize,
      total: askTotal,
    });
  }
  
  return {
    market_id: marketId,
    bids,
    asks,
    spread: 0.002,
    mid_price: midPrice,
  };
}

export function generateMockTimeseries(marketId: string, days = 30): Timeseries {
  const data: { timestamp: string; price: number; volume: number }[] = [];
  const now = new Date();
  let price = 0.3 + Math.random() * 0.4;
  
  for (let i = days * 24; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    price = Math.max(0.01, Math.min(0.99, price + (Math.random() - 0.5) * 0.02));
    data.push({
      timestamp: timestamp.toISOString(),
      price,
      volume: Math.floor(Math.random() * 100000),
    });
  }
  
  return {
    market_id: marketId,
    interval: '1h',
    data,
  };
}

export function generateMockLiquidity(marketId: string): LiquidityData {
  const depthChart: { price: number; bid_depth: number; ask_depth: number }[] = [];
  const midPrice = 0.5;
  
  for (let i = -20; i <= 20; i++) {
    const price = midPrice + i * 0.01;
    depthChart.push({
      price,
      bid_depth: i < 0 ? Math.floor(50000 * Math.exp(-Math.abs(i) * 0.1)) : 0,
      ask_depth: i > 0 ? Math.floor(50000 * Math.exp(-Math.abs(i) * 0.1)) : 0,
    });
  }
  
  return {
    market_id: marketId,
    total_liquidity: 2500000,
    bid_liquidity: 1200000,
    ask_liquidity: 1300000,
    depth_chart: depthChart,
  };
}

export function generateMockAnalysis(marketId: string): AnalysisResult {
  return {
    analysis_id: `analysis-${Date.now()}`,
    market_id: marketId,
    status: 'completed',
    progress: 100,
    drivers: [
      {
        factor: 'Recent polling data',
        impact: 'positive',
        description: 'Latest polls show a 3-point shift in favor of YES outcome',
        confidence: 0.85,
      },
      {
        factor: 'Social media sentiment',
        impact: 'positive',
        description: 'Twitter/Reddit sentiment has turned bullish over the past 48 hours',
        confidence: 0.72,
      },
      {
        factor: 'Expert commentary',
        impact: 'neutral',
        description: 'Mixed signals from political analysts on likely outcome',
        confidence: 0.65,
      },
      {
        factor: 'Historical precedent',
        impact: 'negative',
        description: 'Similar situations historically favored opposite outcome',
        confidence: 0.58,
      },
    ],
    sentiment: {
      overall: 'bullish',
      score: 0.68,
      reddit_sentiment: 0.72,
      news_sentiment: 0.64,
    },
    citations: [
      {
        source: 'Reuters',
        title: 'Latest polling shows tight race',
        url: 'https://reuters.com/article/example',
        snippet: 'New polling data released today shows the race has tightened significantly...',
        published_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        source: 'Bloomberg',
        title: 'Market analysts weigh in on prediction accuracy',
        url: 'https://bloomberg.com/article/example',
        snippet: 'Prediction markets have historically outperformed traditional polling...',
        published_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        source: 'Reddit r/politics',
        title: 'Discussion thread on latest developments',
        url: 'https://reddit.com/r/politics/example',
        snippet: 'Community sentiment appears to have shifted based on recent news...',
        published_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
    summary: 'Analysis indicates a moderately bullish outlook for the YES outcome. Recent polling data and social media sentiment both point towards increased probability, though historical precedent suggests caution. The market appears to be pricing in recent developments efficiently.',
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  };
}

export function generateMockScenario(marketId: string, shockPct: number): ScenarioResult {
  const currentPrice = 0.48;
  const projectedPrice = Math.max(0.01, Math.min(0.99, currentPrice * (1 + shockPct / 100)));
  
  return {
    market_id: marketId,
    shock_pct: shockPct,
    current_price: currentPrice,
    projected_price: projectedPrice,
    pnl: (projectedPrice - currentPrice) * 1000,
    pnl_pct: ((projectedPrice - currentPrice) / currentPrice) * 100,
    max_loss: -currentPrice * 1000,
    confidence_interval: {
      lower: projectedPrice - 0.05,
      upper: projectedPrice + 0.05,
    },
  };
}

export function generateMockMonteCarlo(marketId: string): MonteCarloResult {
  const timestamps: string[] = [];
  const now = new Date();
  const days = 30;
  
  for (let i = 0; i <= days; i++) {
    timestamps.push(new Date(now.getTime() + i * 24 * 60 * 60 * 1000).toISOString());
  }
  
  const basePrice = 0.48;
  const generatePath = (drift: number) => {
    const path: number[] = [basePrice];
    for (let i = 1; i <= days; i++) {
      const prev = path[i - 1];
      const change = drift + (Math.random() - 0.5) * 0.02;
      path.push(Math.max(0.01, Math.min(0.99, prev + change)));
    }
    return path;
  };
  
  return {
    market_id: marketId,
    simulations: 10000,
    time_horizon_days: days,
    quantiles: {
      p5: generatePath(-0.005),
      p25: generatePath(-0.002),
      p50: generatePath(0),
      p75: generatePath(0.002),
      p95: generatePath(0.005),
    },
    timestamps,
    expected_value: 0.52,
    volatility: 0.15,
    var_95: -0.12,
  };
}

export function generateMockHedge(marketId: string): HedgeResult {
  return {
    source_market_id: marketId,
    recommendations: [
      {
        market_id: 'mkt-corr-1',
        market_question: 'Will the opposing party win Senate majority?',
        correlation: -0.72,
        suggested_size: 450,
        hedge_ratio: 0.65,
        caveats: [
          'Correlation based on historical data, may not hold in current environment',
          'Lower liquidity may impact execution',
        ],
      },
      {
        market_id: 'mkt-corr-2',
        market_question: 'Will voter turnout exceed 2020 levels?',
        correlation: 0.58,
        suggested_size: 280,
        hedge_ratio: 0.40,
        caveats: [
          'Indirect correlation through shared drivers',
          'Consider timing differences in resolution',
        ],
      },
    ],
    total_exposure: 1000,
    hedged_exposure: 350,
    risk_reduction_pct: 65,
  };
}
