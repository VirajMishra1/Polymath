from tavily import TavilyClient
from typing import List, Dict, Any
from app.config import get_settings

settings = get_settings()

class TavilySource:
    def __init__(self):
        if not settings.TAVILY_API_KEY:
            raise ValueError("TAVILY_API_KEY not set")
        self.client = TavilyClient(api_key=settings.TAVILY_API_KEY)

    async def search(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        # tavily-python is synchronous, but we can wrap it or just call it if needed.
        # For a hackathon, we can use it as is or use asyncio.to_thread
        import asyncio
        response = await asyncio.to_thread(
            self.client.search, 
            query=query, 
            search_depth="advanced", 
            max_results=max_results
        )
        return response.get("results", [])

    async def extract(self, urls: List[str]) -> List[Dict[str, Any]]:
        import asyncio
        # tavily-python extract
        response = await asyncio.to_thread(
            self.client.extract,
            urls=urls
        )
        return response.get("results", [])
