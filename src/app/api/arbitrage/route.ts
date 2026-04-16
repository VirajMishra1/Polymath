import { NextResponse } from 'next/server';
import { getEvents, parseJsonArraySafe } from '@/lib/polymarket-api';

export const revalidate = 120;

// Arb threshold: events whose YES-sum deviates from 1.00 by >= this are flagged.
// 2% captures real opportunities while filtering rounding noise from mid-priced markets.
const ARB_THRESHOLD = 0.02;
const MIN_MARKETS_PER_EVENT = 3; // 2-market events are just single binary markets in disguise

export interface ArbOpportunity {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  marketsCount: number;
  sumYesPrices: number;
  arbPct: number; // positive = sum > 1 (overpriced in aggregate, short), negative = underpriced (long)
  direction: 'OVERPRICED' | 'UNDERPRICED';
  totalVolume: number;
  totalLiquidity: number;
  markets: {
    id: string;
    question: string;
    yesPrice: number;
    volume24h: number;
  }[];
}

function extractYesPrice(m: { outcomePrices?: string | string[] }): number {
  const arr = parseJsonArraySafe(m.outcomePrices as unknown as string);
  const v = parseFloat(arr[0] ?? '');
  return Number.isFinite(v) ? v : NaN;
}

export async function GET() {
  try {
    const events = await getEvents({
      limit: 80,
      active: true,
      closed: false,
      order: 'volume',
      ascending: false,
    });

    const opportunities: ArbOpportunity[] = [];

    for (const event of events) {
      const markets = event.markets || [];
      if (markets.length < MIN_MARKETS_PER_EVENT) continue;

      // Skip events where any market is closed/resolved — they distort the sum
      const activeMarkets = markets.filter(m => m.active && !m.closed);
      if (activeMarkets.length < MIN_MARKETS_PER_EVENT) continue;

      const yesPrices = activeMarkets.map(extractYesPrice);
      if (yesPrices.some(p => !Number.isFinite(p))) continue;

      const sumYes = yesPrices.reduce((a, b) => a + b, 0);
      const arbPct = sumYes - 1;

      if (Math.abs(arbPct) < ARB_THRESHOLD) continue;

      const totalVolume = activeMarkets.reduce((a, m) => a + (m.volume24hr || 0), 0);
      // Liquidity in Polymarket comes as a string
      const totalLiquidity = activeMarkets.reduce(
        (a, m) => a + parseFloat((m.liquidity as unknown as string) || '0'),
        0
      );

      opportunities.push({
        eventId: event.id,
        eventTitle: event.title,
        eventSlug: event.slug,
        marketsCount: activeMarkets.length,
        sumYesPrices: sumYes,
        arbPct,
        direction: arbPct > 0 ? 'OVERPRICED' : 'UNDERPRICED',
        totalVolume,
        totalLiquidity,
        markets: activeMarkets.map((m, i) => ({
          id: m.id,
          question: m.question,
          yesPrice: yesPrices[i],
          volume24h: m.volume24hr || 0,
        })),
      });
    }

    // Sort by absolute arb size * sqrt(liquidity) — bigger arbs with real depth first
    opportunities.sort(
      (a, b) =>
        Math.abs(b.arbPct) * Math.sqrt(Math.max(b.totalLiquidity, 1)) -
        Math.abs(a.arbPct) * Math.sqrt(Math.max(a.totalLiquidity, 1))
    );

    return NextResponse.json({
      opportunities: opportunities.slice(0, 20),
      scanned: events.length,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('Arbitrage scanner error:', err);
    return NextResponse.json({ error: 'Failed to scan for arbitrage' }, { status: 500 });
  }
}
