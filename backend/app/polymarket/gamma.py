import httpx
from typing import List, Optional, Dict, Any
from app.config import get_settings
from app.models import Event, Market

settings = get_settings()

class GammaClient:
    def __init__(self):
        self.base_url = settings.POLYMARKET_GAMMA_URL

    async def list_events(
        self, 
        limit: int = 50, 
        offset: int = 0, 
        status: str = "active", 
        search: Optional[str] = None
    ) -> List[Event]:
        params = {
            "limit": limit,
            "offset": offset,
            "active": "true" if status == "active" else "false",
            "closed": "false" if status == "active" else "true",
        }
        if search:
            params["search"] = search

        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{self.base_url}/events", params=params)
            resp.raise_for_status()
            data = resp.json()
            
            events = []
            for item in data:
                events.append(Event(
                    id=str(item.get("id")),
                    title=item.get("title", ""),
                    description=item.get("description"),
                    active=item.get("active", True),
                    closed=item.get("closed", False),
                    volume=float(item.get("volume", 0)),
                    liquidity=float(item.get("liquidity", 0)),
                    end_date=item.get("endDate", ""),
                    image_url=item.get("image"),
                    markets_count=len(item.get("markets", [])),
                    category=item.get("category")
                ))
            return events

    async def get_event(self, event_id: str) -> Optional[Event]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{self.base_url}/events/{event_id}")
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            item = resp.json()
            
            return Event(
                id=str(item.get("id")),
                title=item.get("title", ""),
                description=item.get("description"),
                active=item.get("active", True),
                closed=item.get("closed", False),
                volume=float(item.get("volume", 0)),
                liquidity=float(item.get("liquidity", 0)),
                end_date=item.get("endDate", ""),
                image_url=item.get("image"),
                markets_count=len(item.get("markets", [])),
                category=item.get("category")
            )

    async def get_event_markets(self, event_id: str) -> List[Market]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{self.base_url}/events/{event_id}")
            resp.raise_for_status()
            data = resp.json()
            
            markets = []
            for item in data.get("markets", []):
                markets.append(Market(
                    id=str(item.get("id")),
                    question=item.get("question", ""),
                    description=item.get("description"),
                    outcomes=item.get("outcomes", []),
                    outcome_prices=item.get("outcomePrices", []),
                    active=item.get("active", True),
                    closed=item.get("closed", False),
                    volume=float(item.get("volume", 0)),
                    liquidity=float(item.get("liquidity", 0)),
                    end_date=item.get("endDate"),
                    image_url=item.get("image"),
                    group_id=str(item.get("group_id")) if item.get("group_id") else None,
                    clob_token_ids=item.get("clobTokenIds")
                ))
            return markets

    async def get_market(self, market_id: str) -> Optional[Market]:
        # Gamma markets endpoint is /markets?id=...
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{self.base_url}/markets", params={"id": market_id})
            resp.raise_for_status()
            data = resp.json()
            if not data:
                return None
            item = data[0]
            
            return Market(
                id=str(item.get("id")),
                question=item.get("question", ""),
                description=item.get("description"),
                outcomes=item.get("outcomes", []),
                outcome_prices=item.get("outcomePrices", []),
                active=item.get("active", True),
                closed=item.get("closed", False),
                volume=float(item.get("volume", 0)),
                liquidity=float(item.get("liquidity", 0)),
                end_date=item.get("endDate"),
                image_url=item.get("image"),
                group_id=str(item.get("group_id")) if item.get("group_id") else None,
                clob_token_ids=item.get("clobTokenIds")
            )

    async def search_markets(self, query: str) -> List[Market]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{self.base_url}/markets", params={"search": query, "active": "true"})
            resp.raise_for_status()
            data = resp.json()
            
            markets = []
            for item in data:
                markets.append(Market(
                    id=str(item.get("id")),
                    question=item.get("question", ""),
                    description=item.get("description"),
                    outcomes=item.get("outcomes", []),
                    outcome_prices=item.get("outcomePrices", []),
                    active=item.get("active", True),
                    closed=item.get("closed", False),
                    volume=float(item.get("volume", 0)),
                    liquidity=float(item.get("liquidity", 0)),
                    end_date=item.get("endDate"),
                    image_url=item.get("image"),
                    group_id=str(item.get("group_id")) if item.get("group_id") else None,
                    clob_token_ids=item.get("clobTokenIds")
                ))
            return markets
