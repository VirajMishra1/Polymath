import { NextResponse } from 'next/server';
import { getEvents, mapPolymarketEventToEvent } from '@/lib/polymarket-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const tag = searchParams.get('tag') || undefined;

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
