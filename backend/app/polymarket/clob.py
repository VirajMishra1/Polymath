import httpx
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.config import get_settings
from app.models import MarketSnapshot, Orderbook, OrderbookLevel, TimeseriesPoint
from app.polymarket.gamma import GammaClient

settings = get_settings()

class ClobClient:
    def __init__(self):
        self.base_url = settings.POLYMARKET_CLOB_URL
        self.gamma = GammaClient()

    async def get_orderbook(self, token_id: str) -> Orderbook:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{self.base_url}/order-book", params={"token_id": token_id})
            resp.raise_for_status()
            data = resp.json()
            
            bids = [OrderbookLevel(price=float(b[0]), size=float(b[1])) for b in data.get("bids", [])]
            asks = [OrderbookLevel(price=float(a[0]), size=float(a[1])) for a in data.get("asks", [])]
            
            return Orderbook(
                bids=bids,
                asks=asks,
                timestamp=datetime.now()
            )

    async def get_midpoint(self, token_id: str) -> float:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{self.base_url}/midpoint", params={"token_id": token_id})
            resp.raise_for_status()
            data = resp.json()
            return float(data.get("midpoint", 0))

    async def get_price(self, token_id: str) -> float:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{self.base_url}/price", params={"token_id": token_id})
            resp.raise_for_status()
            data = resp.json()
            return float(data.get("price", 0))

    async def get_market_snapshot(self, market_id: str) -> Optional[MarketSnapshot]:
        market = await self.gamma.get_market(market_id)
        if not market or not market.clob_token_ids:
            return None
        
        # Use the first token ID (usually the "Yes" outcome)
        token_id = market.clob_token_ids[0]
        
        async with httpx.AsyncClient() as client:
            # Parallel calls for performance
            import asyncio
            midpoint_task = self.get_midpoint(token_id)
            price_task = self.get_price(token_id)
            orderbook_task = self.get_orderbook(token_id)
            
            midpoint, price, orderbook = await asyncio.gather(midpoint_task, price_task, orderbook_task)
            
            bid_top = orderbook.bids[0].price if orderbook.bids else None
            ask_top = orderbook.asks[0].price if orderbook.asks else None
            spread = (ask_top - bid_top) if (ask_top and bid_top) else 0
            
            return MarketSnapshot(
                market_id=market_id,
                price=price,
                midpoint=midpoint,
                bid_top=bid_top,
                ask_top=ask_top,
                spread=spread,
                depth_ladders={
                    "bids": orderbook.bids[:50],
                    "asks": orderbook.asks[:50]
                },
                timestamp=datetime.now(),
                token_id=token_id
            )

    async def get_timeseries(
        self, 
        token_id: str, 
        interval: str = "1h", 
        lookback_days: int = 30
    ) -> List[TimeseriesPoint]:
        async with httpx.AsyncClient() as client:
            params = {
                "market": token_id,
                "interval": interval,
                "fidelity": 60 if interval == "1h" else 1440 # 60 mins for 1h, 1440 mins for 1d
            }
            # Optional: add startTs if needed
            
            resp = await client.get(f"{self.base_url}/prices-history", params=params)
            resp.raise_for_status()
            data = resp.json()
            
            history = []
            # Polymarket prices-history usually returns list of {t: timestamp, p: price}
            for item in data:
                history.append(TimeseriesPoint(
                    timestamp=datetime.fromtimestamp(item["t"]).isoformat() if isinstance(item["t"], (int, float)) else str(item["t"]),
                    price=float(item["p"])
                ))
            return history
