import { NextRequest, NextResponse } from 'next/server';
import { getEvents } from '@/lib/polymarket-api';

export const revalidate = 180;

export interface ResolvingEvent {
  eventId: string;
  slug: string;
  title: string;
  endDate: string;
  hoursUntilResolution: number;
  volume: number;
  liquidity: number;
  marketsCount: number;
  category: string;
  bucket: '24h' | '3d' | '7d' | '14d' | '30d';
}

function bucketOf(hours: number): ResolvingEvent['bucket'] {
  if (hours <= 24) return '24h';
  if (hours <= 72) return '3d';
  if (hours <= 168) return '7d';
  if (hours <= 336) return '14d';
  return '30d';
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const daysParam = parseInt(url.searchParams.get('days') ?? '30', 10);
    const days = Math.min(Math.max(daysParam, 1), 60);
    const horizonMs = days * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // Pull two pages of active events sorted by volume, then filter by end date.
    // Gamma's end_date filter isn't reliable across all event shapes, so we
    // over-fetch and filter here.
    const [page1, page2] = await Promise.all([
      getEvents({ limit: 100, active: true, closed: false, order: 'volume', ascending: false }),
      getEvents({ limit: 100, offset: 100, active: true, closed: false, order: 'volume', ascending: false }),
    ]);
    const events = [...page1, ...page2];

    const resolving: ResolvingEvent[] = [];
    for (const event of events) {
      if (!event.endDate) continue;
      const endMs = new Date(event.endDate).getTime();
      if (!Number.isFinite(endMs)) continue;
      const delta = endMs - now;
      if (delta <= 0 || delta > horizonMs) continue;

      const hours = delta / (60 * 60 * 1000);
      resolving.push({
        eventId: event.id,
        slug: event.slug,
        title: event.title,
        endDate: event.endDate,
        hoursUntilResolution: hours,
        volume: event.volume ?? 0,
        liquidity: event.liquidity ?? 0,
        marketsCount: event.markets?.length ?? 0,
        category: event.tags?.[0]?.label ?? 'Other',
        bucket: bucketOf(hours),
      });
    }

    resolving.sort((a, b) => {
      // Primary: bucket order; secondary: volume desc
      const bucketRank = { '24h': 0, '3d': 1, '7d': 2, '14d': 3, '30d': 4 };
      if (bucketRank[a.bucket] !== bucketRank[b.bucket]) {
        return bucketRank[a.bucket] - bucketRank[b.bucket];
      }
      return b.volume - a.volume;
    });

    return NextResponse.json({
      events: resolving.slice(0, 100),
      total: resolving.length,
      horizonDays: days,
      timestamp: now,
    });
  } catch (err) {
    console.error('Resolutions error:', err);
    return NextResponse.json({ error: 'Failed to fetch resolution calendar' }, { status: 500 });
  }
}
