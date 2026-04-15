from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# --- Browsing ---

class Market(BaseModel):
    id: str
    question: str
    description: Optional[str] = None
    outcomes: List[str]
    outcome_prices: List[str]
    active: bool
    closed: bool
    volume: float
    liquidity: float
    end_date: Optional[str] = None
    image_url: Optional[str] = None
    group_id: Optional[str] = None
    clob_token_ids: Optional[List[str]] = None

class Event(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    active: bool
    closed: bool
    volume: float
    liquidity: float
    end_date: str
    image_url: Optional[str] = None
    markets_count: int
    category: Optional[str] = None

# --- Market Data ---

class OrderbookLevel(BaseModel):
    price: float
    size: float

class Orderbook(BaseModel):
    bids: List[OrderbookLevel]
    asks: List[OrderbookLevel]
    timestamp: datetime

class MarketSnapshot(BaseModel):
    market_id: str
    price: float
    midpoint: float
    bid_top: Optional[float] = None
    ask_top: Optional[float] = None
    spread: float
    depth_ladders: Dict[str, List[OrderbookLevel]]
    timestamp: datetime
    token_id: str

class TimeseriesPoint(BaseModel):
    timestamp: str
    price: float

# --- Analysis ---

class Citation(BaseModel):
    url: str
    source_type: str # "news" | "reddit"
    title: str
    extracted_at: datetime

class Driver(BaseModel):
    driver: str
    evidence_urls: List[str]
    confidence: float

class SentimentMetrics(BaseModel):
    news_score: float # -1..1
    reddit_score: float # -1..1
    volume_metrics: Dict[str, int] # {posts: int, comments: int}
    key_phrases: List[str]

class Narrative(BaseModel):
    what_happened: str
    why_now: str
    what_to_watch: str

class ExplainMoveResult(BaseModel):
    headline_summary: str
    drivers: List[Driver]
    sentiment: SentimentMetrics
    narrative: Narrative
    citations: List[Citation]

class AnalysisRequest(BaseModel):
    market_id: str
    lookback_days: int = 30
    news_query: Optional[str] = None
    include_reddit: bool = True
    max_news_sources: int = 10
    max_reddit_threads: int = 10

class AnalysisResponse(BaseModel):
    analysis_id: str
    status: str # "queued" | "processing" | "completed" | "failed"
    progress: float = 0.0
    result: Optional[ExplainMoveResult] = None

# --- Risk ---

class ScenarioPnl(BaseModel):
    position_value_delta: float
    max_loss: float
    max_gain: float

class Scenario(BaseModel):
    name: str
    shock_pct: float
    projected_price: float
    pnl: ScenarioPnl

class ScenarioResult(BaseModel):
    base_price: float
    scenarios: List[Scenario]
    slider_model: Dict[str, Any] # {unit: "pct", min:-50, max:+50, step:1}

class MonteCarloResult(BaseModel):
    horizon_days: int
    n_paths: int
    bands: Dict[str, List[float]] # {p5[], p25[], p50[], p75[], p95[]}
    sample_paths: Optional[List[List[float]]] = None

class HedgeMarket(BaseModel):
    market_id: str
    reason: str
    correlation_proxy: float
    liquidity_score: float
    suggested_size: float
    expected_downside_reduction: float

class HedgeRecommendation(BaseModel):
    hedge_markets: List[HedgeMarket]
    caveats: List[str]

class SlippageEstimate(BaseModel):
    order_size_usd: float
    expected_avg_fill_price: float
    slippage_pct: float

class WallLevel(BaseModel):
    price: float
    size_usd: float
    side: str # "bid" | "ask"

class LiquidityMetrics(BaseModel):
    market_id: str
    slippage_estimates: List[SlippageEstimate]
    wall_levels: List[WallLevel]

class ArbOpportunity(BaseModel):
    description: str
    potential_profit_pct: float

class ArbCheck(BaseModel):
    sum_prices: float
    deviation: float
    opportunities: List[ArbOpportunity]
