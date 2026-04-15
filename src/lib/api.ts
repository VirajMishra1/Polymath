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
  SearchResult,
} from './types';

const API_BASE = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  search: (q: string) => 
    fetchApi<SearchResult>(`/search?q=${encodeURIComponent(q)}`),

  events: {
    list: () => fetchApi<Event[]>('/events'),
    get: (id: string) => fetchApi<Event>(`/events/${id}`),
    markets: (id: string) => fetchApi<Market[]>(`/events/${id}/markets`),
  },

  markets: {
    snapshot: (id: string) => fetchApi<MarketSnapshot>(`/markets/${id}/snapshot`),
    orderbook: (id: string, depth = 50) => 
      fetchApi<Orderbook>(`/markets/${id}/orderbook?depth=${depth}`),
    timeseries: (id: string, interval = '1h', lookbackDays = 30) =>
      fetchApi<Timeseries>(`/markets/${id}/timeseries?interval=${interval}&lookback_days=${lookbackDays}`),
  },

  risk: {
    liquidity: (id: string) => fetchApi<LiquidityData>(`/risk/liquidity/${id}`),
    scenario: (data: { market_id: string; shock_pct: number; position_size?: number }) =>
      fetchApi<ScenarioResult>('/risk/scenario', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    montecarlo: (data: { market_id: string; simulations?: number; time_horizon_days?: number }) =>
      fetchApi<MonteCarloResult>('/risk/montecarlo', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    hedge: (data: { market_id: string; position_size: number }) =>
      fetchApi<HedgeResult>('/risk/hedge', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  analysis: {
    create: (data: { market_id: string; time_window?: { start: string; end: string } }) =>
      fetchApi<{ analysis_id: string }>('/analysis', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    get: (analysisId: string) => fetchApi<AnalysisResult>(`/analysis/${analysisId}`),
    stream: (analysisId: string) => {
      return new EventSource(`${API_BASE}/analysis/${analysisId}/stream`);
    },
  },
};
