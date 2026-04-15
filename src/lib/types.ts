export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  volume: number;
  liquidity: number;
  end_date: string;
  created_at: string;
  markets_count: number;
  image_url?: string;
  active?: boolean;
  closed?: boolean;
}

export interface Market {
  id: string;
  event_id: string;
  question: string;
  outcome_yes: string;
  outcome_no: string;
  price_yes: number;
  price_no: number;
  volume: number;
  volume_24h?: number;
  liquidity: number;
  end_date: string;
  status: 'active' | 'closed' | 'resolved';
  resolved_outcome?: string;
  clob_token_ids?: string[];
  best_bid?: number;
  best_ask?: number;
  last_trade_price?: number;
  spread?: number;
  one_day_price_change?: number;
  image_url?: string;
  description?: string;
}

export interface MarketSnapshot {
  market_id: string;
  price_yes: number;
  price_no: number;
  volume_24h: number;
  volume_total: number;
  liquidity: number;
  open_interest: number;
  last_trade_price: number;
  last_trade_time: string;
  price_change_24h: number;
  price_change_7d: number;
}

export interface OrderbookEntry {
  price: number;
  size: number;
  total: number;
}

export interface Orderbook {
  market_id: string;
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
  spread: number;
  mid_price: number;
}

export interface TimeseriesPoint {
  timestamp: string;
  price: number;
  volume: number;
}

export interface Timeseries {
  market_id: string;
  interval: string;
  data: TimeseriesPoint[];
}

export interface LiquidityData {
  market_id: string;
  total_liquidity: number;
  bid_liquidity: number;
  ask_liquidity: number;
  depth_chart: {
    price: number;
    bid_depth: number;
    ask_depth: number;
  }[];
}

export interface AnalysisDriver {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  confidence: number;
}

export interface AnalysisCitation {
  source: string;
  title: string;
  url: string;
  snippet: string;
  published_at: string;
}

export interface AnalysisResult {
  analysis_id: string;
  market_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  drivers: AnalysisDriver[];
  sentiment: {
    overall: 'bullish' | 'bearish' | 'neutral';
    score: number;
    reddit_sentiment: number;
    news_sentiment: number;
  };
  citations: AnalysisCitation[];
  summary: string;
  created_at: string;
  completed_at?: string;
}

export interface ScenarioResult {
  market_id: string;
  shock_pct: number;
  current_price: number;
  projected_price: number;
  pnl: number;
  pnl_pct: number;
  max_loss: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
}

export interface MonteCarloResult {
  market_id: string;
  simulations: number;
  time_horizon_days: number;
  quantiles: {
    p5: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p95: number[];
  };
  timestamps: string[];
  expected_value: number;
  volatility: number;
  var_95: number;
}

export interface HedgeRecommendation {
  market_id: string;
  market_question: string;
  correlation: number;
  suggested_size: number;
  hedge_ratio: number;
  caveats: string[];
}

export interface HedgeResult {
  source_market_id: string;
  recommendations: HedgeRecommendation[];
  total_exposure: number;
  hedged_exposure: number;
  risk_reduction_pct: number;
}

export interface SearchResult {
  events: Event[];
  markets: Market[];
  total_events: number;
  total_markets: number;
}
