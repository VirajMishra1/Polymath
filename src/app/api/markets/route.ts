import { NextResponse } from 'next/server';
import { getMarkets, mapPolymarketMarketToMarket } from '@/lib/polymarket-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const markets = await getMarkets({
      limit: search ? 100 : limit,
      offset: search ? 0 : offset,
      active: true,
      order: 'volume24hr',
      ascending: false,
    });

    let filteredMarkets = markets;
    
    if (search) {
      const lowerSearch = search.toLowerCase();
      filteredMarkets = markets.filter(m => 
        m.question.toLowerCase().includes(lowerSearch) ||
        (m.description && m.description.toLowerCase().includes(lowerSearch))
      ).slice(0, limit);
    }

    const mappedMarkets = filteredMarkets.map(m => mapPolymarketMarketToMarket(m, ''));

    return NextResponse.json({
      markets: mappedMarkets,
      total: filteredMarkets.length,
    });
  } catch (error) {
    console.error('Error fetching markets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets', markets: [] },
      { status: 500 }
    );
  }
}
