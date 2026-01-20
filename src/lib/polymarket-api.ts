const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';
const CLOB_API_BASE = 'https://clob.polymarket.com';

export interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  image: string;
  icon: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  liquidity: number;
  volume: number;
  openInterest: number;
  createdAt: string;
  updatedAt: string;
  competitiveIndex: number;
  markets: PolymarketMarket[];
  tags: { id: string; slug: string; label: string }[];
}

export interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  endDate: string;
  liquidity: string;
  volume: string;
  volume24hr: number;
  outcomes: string[];
  outcomePrices: string[];
  clobTokenIds: string[];
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  groupItemTitle: string;
  groupItemThreshold: string;
  image: string;
  icon: string;
  description: string;
  bestBid: number;
  bestAsk: number;
  lastTradePrice: number;
  spread: number;
  oneDayPriceChange: number;
}

export interface OrderbookResponse {
  market: string;
  asset_id: string;
  timestamp: string;
  bids: { price: string; size: string }[];
  asks: { price: string; size: string }[];
  hash: string;
}

export interface PriceHistoryPoint {
  t: number;
  p: number;
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 },
      });
      if (response.ok) return response;
      if (response.status === 429) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function getEvents(params?: {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  order?: string;
  ascending?: boolean;
  tag_slug?: string;
}): Promise<PolymarketEvent[]> {
  const searchParams = new URLSearchParams();
  
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());
  if (params?.active !== undefined) searchParams.set('active', params.active.toString());
  if (params?.closed !== undefined) searchParams.set('closed', params.closed.toString());
  if (params?.order) searchParams.set('order', params.order);
  if (params?.ascending !== undefined) searchParams.set('ascending', params.ascending.toString());
  if (params?.tag_slug) searchParams.set('tag_slug', params.tag_slug);

  const url = `${GAMMA_API_BASE}/events?${searchParams.toString()}`;
  const response = await fetchWithRetry(url);
  return response.json();
}

export async function getEventById(id: string): Promise<PolymarketEvent | null> {
  try {
    const url = `${GAMMA_API_BASE}/events/${id}`;
    const response = await fetchWithRetry(url);
    return response.json();
  } catch {
    return null;
  }
}

export async function getEventBySlug(slug: string): Promise<PolymarketEvent | null> {
  try {
    const url = `${GAMMA_API_BASE}/events/slug/${slug}`;
    const response = await fetchWithRetry(url);
    return response.json();
  } catch {
    return null;
  }
}

export async function getMarkets(params?: {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  order?: string;
  ascending?: boolean;
}): Promise<PolymarketMarket[]> {
  const searchParams = new URLSearchParams();
  
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());
  if (params?.active !== undefined) searchParams.set('active', params.active.toString());
  if (params?.closed !== undefined) searchParams.set('closed', params.closed.toString());
  if (params?.order) searchParams.set('order', params.order);
  if (params?.ascending !== undefined) searchParams.set('ascending', params.ascending.toString());

  const url = `${GAMMA_API_BASE}/markets?${searchParams.toString()}`;
  const response = await fetchWithRetry(url);
  return response.json();
}

export async function getMarketById(id: string): Promise<PolymarketMarket | null> {
  try {
    const url = `${GAMMA_API_BASE}/markets/${id}`;
    const response = await fetchWithRetry(url);
    return response.json();
  } catch {
    return null;
  }
}

export async function getMarketBySlug(slug: string): Promise<PolymarketMarket | null> {
  try {
    const url = `${GAMMA_API_BASE}/markets/slug/${slug}`;
    const response = await fetchWithRetry(url);
    return response.json();
  } catch {
    return null;
  }
}

export async function getOrderbook(tokenId: string): Promise<OrderbookResponse | null> {
  try {
    const url = `${CLOB_API_BASE}/book?token_id=${tokenId}`;
    const response = await fetchWithRetry(url);
    return response.json();
  } catch {
    return null;
  }
}

export async function getMidpoint(tokenId: string): Promise<{ mid: number } | null> {
  try {
    const url = `${CLOB_API_BASE}/midpoint?token_id=${tokenId}`;
    const response = await fetchWithRetry(url);
    return response.json();
  } catch {
    return null;
  }
}

export async function getPriceHistory(
  tokenId: string,
  interval: '1h' | '6h' | '1d' | '1w' | 'max' = '1w',
  fidelity?: number
): Promise<PriceHistoryPoint[]> {
  try {
    const searchParams = new URLSearchParams();
    searchParams.set('market', tokenId);
    searchParams.set('interval', interval);
    
    const minFidelityMap: Record<string, number> = {
      '1h': 1,
      '6h': 1,
      '1d': 1,
      '1w': 5,
      'max': 60,
    };
    const minFidelity = minFidelityMap[interval] || 5;
    searchParams.set('fidelity', (fidelity || minFidelity).toString());

    const url = `${CLOB_API_BASE}/prices-history?${searchParams.toString()}`;
    const response = await fetchWithRetry(url);
    const data = await response.json();
    return data.history || [];
  } catch {
    return [];
  }
}

export function mapPolymarketEventToEvent(pm: PolymarketEvent) {
  const tags = pm.tags || [];
  const category = tags.length > 0 ? tags[0].label : 'Other';
  
  return {
    id: pm.id,
    title: pm.title,
    slug: pm.slug,
    description: pm.description || '',
    category,
    volume: pm.volume || 0,
    liquidity: pm.liquidity || 0,
    end_date: pm.endDate || new Date().toISOString(),
    created_at: pm.createdAt || new Date().toISOString(),
    markets_count: pm.markets?.length || 0,
    image_url: pm.image || pm.icon,
    active: pm.active,
    closed: pm.closed,
  };
}

function parseJsonArraySafe(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function mapPolymarketMarketToMarket(pm: PolymarketMarket, eventId: string) {
  const outcomes = parseJsonArraySafe(pm.outcomes as unknown as string);
  const outcomePrices = parseJsonArraySafe(pm.outcomePrices as unknown as string);
  const clobTokenIds = parseJsonArraySafe(pm.clobTokenIds as unknown as string);
  
  const priceYes = outcomePrices[0] ? parseFloat(outcomePrices[0]) : 0.5;
  const priceNo = outcomePrices[1] ? parseFloat(outcomePrices[1]) : 0.5;
  
  return {
    id: pm.id,
    event_id: eventId,
    question: pm.question,
    outcome_yes: outcomes[0] || 'Yes',
    outcome_no: outcomes[1] || 'No',
    price_yes: priceYes,
    price_no: priceNo,
    volume: parseFloat(pm.volume || '0'),
    volume_24h: pm.volume24hr || 0,
    liquidity: parseFloat(pm.liquidity || '0'),
    end_date: pm.endDate,
    status: pm.closed ? 'closed' : pm.active ? 'active' : 'resolved' as 'active' | 'closed' | 'resolved',
    clob_token_ids: clobTokenIds,
    best_bid: pm.bestBid || 0,
    best_ask: pm.bestAsk || 0,
    last_trade_price: pm.lastTradePrice || priceYes,
    spread: pm.spread || 0,
    one_day_price_change: pm.oneDayPriceChange || 0,
    image_url: pm.image || pm.icon,
    description: pm.description,
  };
}
