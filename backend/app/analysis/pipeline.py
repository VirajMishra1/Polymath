import asyncio
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from app.models import (
    AnalysisRequest, AnalysisResponse, ExplainMoveResult, 
    Citation, Driver, SentimentMetrics, Narrative,
    MarketSnapshot
)
from app.polymarket.gamma import GammaClient
from app.polymarket.clob import ClobClient
from app.sources.tavily_client import TavilySource
from app.sources.reddit_client import RedditSource
from app.compress.token_company import TokenCompanyClient
from app.llm.gemini_provider import GeminiProvider
from app.storage.state import storage

class AnalysisPipeline:
    def __init__(self):
        self.gamma = GammaClient()
        self.clob = ClobClient()
        self.tavily = TavilySource()
        self.reddit = RedditSource()
        self.compressor = TokenCompanyClient()
        self.llm = GeminiProvider()

    async def run_analysis(self, request: AnalysisRequest) -> str:
        analysis_id = str(uuid.uuid4())
        
        # Initialize state
        storage.set(f"analysis:{analysis_id}", {
            "analysis_id": analysis_id,
            "status": "queued",
            "progress": 0.0
        })
        
        # Start background task
        asyncio.create_task(self._execute_pipeline(analysis_id, request))
        
        return analysis_id

    async def _execute_pipeline(self, analysis_id: str, request: AnalysisRequest):
        try:
            self._update_progress(analysis_id, "processing", 0.1)
            
            # 1. Fetch Market Data
            market = await self.gamma.get_market(request.market_id)
            if not market:
                self._update_progress(analysis_id, "failed", 0.0, error="Market not found")
                return
                
            snapshot = await self.clob.get_market_snapshot(request.market_id)
            self._update_progress(analysis_id, "processing", 0.2)
            
            # 2. Search & Extract
            query = request.news_query or f"{market.question} Polymarket prediction market"
            
            # Run search and reddit in parallel
            search_task = self.tavily.search(query, max_results=request.max_news_sources)
            reddit_task = self.reddit.search_submissions(query, limit=request.max_reddit_threads) if request.include_reddit else asyncio.sleep(0, result=[])
            
            news_results, reddit_results = await asyncio.gather(search_task, reddit_task)
            self._update_progress(analysis_id, "processing", 0.4)
            
            # Extract news content
            news_urls = [r["url"] for r in news_results]
            news_content = await self.tavily.extract(news_urls)
            self._update_progress(analysis_id, "processing", 0.6)
            
            # 3. Build Corpus & Compress
            corpus = f"Market: {market.question}\nCurrent Price: {snapshot.price}\n\n"
            citations = []
            
            for nc in news_content:
                corpus += f"SOURCE: {nc['url']}\nCONTENT: {nc.get('raw_content', '')[:2000]}\n\n"
                citations.append(Citation(
                    url=nc["url"],
                    source_type="news",
                    title=nc.get("title", "News Article"),
                    extracted_at=datetime.now()
                ))
                
            for rs in reddit_results:
                corpus += f"REDDIT: {rs['title']}\n{rs['selftext'][:1000]}\n\n"
                citations.append(Citation(
                    url=rs["url"],
                    source_type="reddit",
                    title=rs["title"],
                    extracted_at=datetime.now()
                ))
                
            compressed_corpus = await self.compressor.compress(corpus, target_tokens=4000)
            self._update_progress(analysis_id, "processing", 0.8)
            
            # 4. LLM Analysis
            prompt = self._build_analysis_prompt(market.question, compressed_corpus)
            analysis_json = await self.llm.generate_json(prompt)
            
            # 5. Finalize Result
            result = ExplainMoveResult(
                headline_summary=analysis_json.get("headline_summary", "Analysis complete."),
                drivers=[Driver(**d) for d in analysis_json.get("drivers", [])],
                sentiment=SentimentMetrics(
                    news_score=analysis_json.get("sentiment", {}).get("news_score", 0),
                    reddit_score=analysis_json.get("sentiment", {}).get("reddit_score", 0),
                    volume_metrics={
                        "posts": len(news_results),
                        "comments": sum(r.get("num_comments", 0) for r in reddit_results)
                    },
                    key_phrases=analysis_json.get("sentiment", {}).get("key_phrases", [])
                ),
                narrative=Narrative(**analysis_json.get("narrative", {
                    "what_happened": "Data analyzed.",
                    "why_now": "Market active.",
                    "what_to_watch": "Price action."
                })),
                citations=citations
            )
            
            storage.set(f"analysis:{analysis_id}", {
                "analysis_id": analysis_id,
                "status": "completed",
                "progress": 1.0,
                "result": result.model_dump()
            })
            
        except Exception as e:
            print(f"Pipeline error: {str(e)}")
            self._update_progress(analysis_id, "failed", 0.0, error=str(e))

    def _update_progress(self, analysis_id: str, status: str, progress: float, error: str = None):
        current = storage.get(f"analysis:{analysis_id}") or {}
        current.update({
            "status": status,
            "progress": progress
        })
        if error:
            current["error"] = error
        storage.set(f"analysis:{analysis_id}", current)

    def _build_analysis_prompt(self, question: str, corpus: str) -> str:
        return f"""
        Analyze the following prediction market: "{question}"
        
        Based on the provided corpus of news and social media content, explain the recent price moves and narrative.
        
        Corpus:
        {corpus}
        
        Return a JSON object with the following structure:
        {{
            "headline_summary": "string",
            "drivers": [
                {{ "driver": "string", "evidence_urls": ["url1", "url2"], "confidence": 0.9 }}
            ],
            "sentiment": {{
                "news_score": float (-1 to 1),
                "reddit_score": float (-1 to 1),
                "key_phrases": ["phrase1", "phrase2"]
            }},
            "narrative": {{
                "what_happened": "string",
                "why_now": "string",
                "what_to_watch": "string"
            }}
        }}
        """
