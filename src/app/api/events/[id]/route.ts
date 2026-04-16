import { NextResponse } from 'next/server';
import {
  getEventById,
  getEventBySlug,
  mapPolymarketEventToEvent,
  mapPolymarketMarketToMarket,
} from '@/lib/polymarket-api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Callers pass either numeric IDs or slugs. Try id first for numerics
    // (avoids a wasted round-trip), fall through to slug lookup otherwise.
    const isNumeric = /^\d+$/.test(id);
    let event = isNumeric ? await getEventById(id) : null;
    if (!event) event = await getEventBySlug(id);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const mappedEvent = mapPolymarketEventToEvent(event);
    const mappedMarkets = (event.markets || []).map(m => mapPolymarketMarketToMarket(m, event.id));

    return NextResponse.json({
      event: mappedEvent,
      markets: mappedMarkets,
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}
