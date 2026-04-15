# Poly-Terminal Backend

Production-grade REST API for Poly-Terminal, a Bloomberg-like terminal for Polymarket.

## Tech Stack
- **Python 3.11+**
- **FastAPI**: High-performance web framework.
- **Pydantic**: Data validation and settings management.
- **httpx**: Async HTTP client for external APIs.
- **Redis**: Caching and job state (optional, falls back to in-memory).
- **LLM**: Google Gemini for narrative extraction.
- **Compression**: The Token Company for prompt optimization.
- **Search**: Tavily for web extraction and Reddit for sentiment.

## Project Structure
- `app/main.py`: FastAPI application and routers.
- `app/polymarket/`: Clients for Gamma and CLOB APIs.
- `app/sources/`: Clients for Tavily and Reddit.
- `app/compress/`: The Token Company integration.
- `app/llm/`: Gemini provider implementation.
- `app/analysis/`: Background analysis pipeline.
- `app/risk/`: Quantitative risk modules (Monte Carlo, Scenarios, etc.).
- `app/storage/`: State management (Redis/Memory).

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```

3. **Run the Server**:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Endpoints

### Browsing
- `GET /api/events`: List active Polymarket events.
- `GET /api/markets/{id}`: Get market details.
- `GET /api/search?q=...`: Search markets.

### Analysis
- `POST /api/analysis`: Start a new "Explain Move" analysis.
- `GET /api/analysis/{id}`: Poll for analysis results.

### Risk Tools
- `POST /api/risk/scenario`: Compute P&L under different price shocks.
- `POST /api/risk/montecarlo`: Generate price projection fan charts.
- `GET /api/risk/liquidity/{id}`: Compute slippage and identify orderbook walls.
- `POST /api/risk/hedge`: Get hedge recommendations from related markets.

## Health Check
- `GET /healthz`
