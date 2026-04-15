export interface MarketArticle {
  id: string;
  title: string;
  source: string;
  sourceType: 'news' | 'reddit' | 'twitter' | 'analysis';
  url: string;
  publishedAt: string;
  timestamp: number;
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  impactScore: number;
  keyPoints: string[];
}

export interface PriceEvent {
  index?: number;
  timestamp: number;
  price: number;
  priceChange: number;
  priceChangePct: number;
  type: 'dip' | 'spike' | 'normal';
  significance: number;
  articles: MarketArticle[];
  aiAnalysis?: string;
}

export function getArticlesForMarket(_marketId: string): MarketArticle[] {
  return [];
}

export function detectPriceEvents(
  priceHistory: { timestamp: number; price: number }[],
  _marketId: string,
  threshold = 0.05
): PriceEvent[] {
  if (priceHistory.length < 2) return [];

  const events: PriceEvent[] = [];

  for (let i = 1; i < priceHistory.length; i++) {
    const prev = priceHistory[i - 1];
    const curr = priceHistory[i];
    if (!prev?.price || !curr?.price) continue;

    const priceChange = curr.price - prev.price;
    const priceChangePct = priceChange / prev.price;

    if (Math.abs(priceChangePct) >= threshold) {
      const significance = Math.min(1, Math.abs(priceChangePct) / (threshold * 3));
      events.push({
        index: i,
        timestamp: curr.timestamp,
        price: curr.price,
        priceChange,
        priceChangePct,
        type: priceChangePct < 0 ? 'dip' : 'spike',
        significance,
        articles: [],
      });
    }
  }

  // deduplicate closely spaced events — keep only the most significant within 1h windows
  const deduped: PriceEvent[] = [];
  for (const event of events) {
    const nearby = deduped.find(e => Math.abs(e.timestamp - event.timestamp) < 3600);
    if (!nearby) {
      deduped.push(event);
    } else if (event.significance > nearby.significance) {
      deduped.splice(deduped.indexOf(nearby), 1, event);
    }
  }

  return deduped.slice(0, 20);
}
