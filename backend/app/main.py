from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from app.config import get_settings
from app.models import (
    Event, Market, MarketSnapshot, Orderbook, TimeseriesPoint,
    AnalysisRequest, AnalysisResponse, ExplainMoveResult,
    ScenarioResult, MonteCarloResult, LiquidityMetrics, HedgeRecommendation
)
from app.polymarket.gamma import GammaClient
from app.polymarket.clob import ClobClient
from app.analysis.pipeline import AnalysisPipeline
from app.risk.scenario import ScenarioAnalyzer
from app.risk.montecarlo import MonteCarloSimulator
from app.risk.liquidity import LiquidityAnalyzer
from app.risk.hedge import HedgeAnalyzer
from app.storage.state import storage

settings = get_settings()

app = FastAPI(title="Poly-Terminal API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Clients
gamma = GammaClient()
clob = ClobClient()
pipeline = AnalysisPipeline()
scenario_analyzer = ScenarioAnalyzer()
mc_simulator = MonteCarloSimulator()
liquidity_analyzer = LiquidityAnalyzer()
hedge_analyzer = HedgeAnalyzer()

# --- Health ---

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

# --- Polymarket Browsing ---

@app.get("/api/events", response_model=List[Event])
async def list_events(
    limit: int = 50, 
    offset: int = 0, 
    status: str = "active", 
    search: Optional[str] = None
):
    return await gamma.list_events(limit, offset, status, search)

@app.get("/api/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    event = await gamma.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@app.get("/api/events/{event_id}/markets", response_model=List[Market])
async def get_event_markets(event_id: str):
    return await gamma.get_event_markets(event_id)

@app.get("/api/markets/{market_id}", response_model=Market)
async def get_market(market_id: str):
    market = await gamma.get_market(market_id)
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    return market

@app.get("/api/search", response_model=List[Market])
async def search_markets(q: str):
    return await gamma.search_markets(q)

# --- Live Market Data ---

@app.get("/api/markets/{market_id}/snapshot", response_model=MarketSnapshot)
async def get_market_snapshot(market_id: str):
    snapshot = await clob.get_market_snapshot(market_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not available for this market")
    return snapshot

@app.get("/api/markets/{market_id}/orderbook", response_model=Orderbook)
async def get_orderbook(market_id: str, depth: int = 50):
    market = await gamma.get_market(market_id)
    if not market or not market.clob_token_ids:
        raise HTTPException(status_code=404, detail="CLOB data not available for this market")
    return await clob.get_orderbook(market.clob_token_ids[0])

@app.get("/api/markets/{market_id}/timeseries", response_model=List[TimeseriesPoint])
async def get_timeseries(
    market_id: str, 
    interval: str = "1h", 
    lookback_days: int = 30
):
    market = await gamma.get_market(market_id)
    if not market or not market.clob_token_ids:
        raise HTTPException(status_code=404, detail="Timeseries not available for this market")
    return await clob.get_timeseries(market.clob_token_ids[0], interval, lookback_days)

# --- Analysis ---

@app.post("/api/analysis", response_model=AnalysisResponse)
async def create_analysis(request: AnalysisRequest):
    analysis_id = await pipeline.run_analysis(request)
    return AnalysisResponse(analysis_id=analysis_id, status="queued")

@app.get("/api/analysis/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: str):
    data = storage.get(f"analysis:{analysis_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return AnalysisResponse(**data)

# --- Risk Tools ---

@app.post("/api/risk/scenario", response_model=ScenarioResult)
async def compute_scenario(
    market_id: str, 
    position: Dict[str, float], 
    shocks: List[float] = Query([-20, -10, 10, 20])
):
    snapshot = await clob.get_market_snapshot(market_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Market snapshot not available")
    return scenario_analyzer.compute_scenarios(snapshot, position, shocks)

@app.post("/api/risk/montecarlo", response_model=MonteCarloResult)
async def run_montecarlo(
    market_id: str, 
    horizon_days: int = 30, 
    n_paths: int = 1000
):
    market = await gamma.get_market(market_id)
    if not market or not market.clob_token_ids:
        raise HTTPException(status_code=404, detail="Market not found")
        
    timeseries = await clob.get_timeseries(market.clob_token_ids[0])
    return mc_simulator.run_monte_carlo(timeseries, horizon_days, n_paths)

@app.get("/api/risk/liquidity/{market_id}", response_model=LiquidityMetrics)
async def get_liquidity(market_id: str):
    market = await gamma.get_market(market_id)
    if not market or not market.clob_token_ids:
        raise HTTPException(status_code=404, detail="Market not found")
        
    orderbook = await clob.get_orderbook(market.clob_token_ids[0])
    return liquidity_analyzer.compute_liquidity_metrics(orderbook, market_id)

@app.post("/api/risk/hedge", response_model=HedgeRecommendation)
async def suggest_hedge(
    market_id: str, 
    position: Dict[str, float]
):
    current_market = await gamma.get_market(market_id)
    if not current_market:
        raise HTTPException(status_code=404, detail="Market not found")
        
    # Get related markets from the same event
    if current_market.group_id:
        related_markets = await gamma.get_event_markets(current_market.group_id)
    else:
        related_markets = []
        
    return hedge_analyzer.suggest_hedges(current_market, position, related_markets)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
