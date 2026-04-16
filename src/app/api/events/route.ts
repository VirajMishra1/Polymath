import { NextResponse } from 'next/server';
import { getEvents, mapPolymarketEventToEvent } from '@/lib/polymarket-api';

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  const n = parseInt(raw ?? '');
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = clampInt(searchParams.get('limit'), 100, 1, 200);
  const offset = clampInt(searchParams.get('offset'), 0, 0, 10000);
  const rawTag = searchParams.get('tag');
  const tag = rawTag && /^[a-z0-9-]{1,60}$/i.test(rawTag) ? rawTag : undefined;

  try {
    const events = await getEvents({
      limit,
      offset,
      active: true,
      closed: false,
      order: 'volume',
      ascending: false,
      tag_slug: tag,
    });

    const mappedEvents = events.map(mapPolymarketEventToEvent);
    
    const sortedEvents = mappedEvents.sort((a, b) => {
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      if (a.closed && !b.closed) return 1;
      if (!a.closed && b.closed) return -1;
      return b.volume - a.volume;
    });

    return NextResponse.json({
      events: sortedEvents,
      total: sortedEvents.length,
      offset,
      limit,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
