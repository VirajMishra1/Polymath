import { NextResponse } from 'next/server';
import { getEventById, mapPolymarketEventToEvent, mapPolymarketMarketToMarket } from '@/lib/polymarket-api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const event = await getEventById(id);
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
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
