import { NextResponse } from 'next/server';
import { getMarketById, getOrderbook, getPriceHistory, mapPolymarketMarketToMarket } from '@/lib/polymarket-api';

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const includeOrderbook = searchParams.get('orderbook') === 'true';
  const includeHistory = searchParams.get('history') === 'true';
  const interval = (searchParams.get('interval') as '1h' | '6h' | '1d' | '1w' | 'max') || '1w';

  try {
    const market = await getMarketById(id);
    
    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }

    const mappedMarket = mapPolymarketMarketToMarket(market, '');
    const tokenIds = parseJsonArraySafe(market.clobTokenIds as unknown as string);
    
    let orderbook = null;
    let priceHistory = null;

    if (includeOrderbook && tokenIds[0]) {
      orderbook = await getOrderbook(tokenIds[0]);
    }

    if (includeHistory && tokenIds[0]) {
      priceHistory = await getPriceHistory(tokenIds[0], interval);
    }

    return NextResponse.json({
      market: mappedMarket,
      orderbook,
      priceHistory,
    });
  } catch (error) {
    console.error('Error fetching market:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market' },
      { status: 500 }
    );
  }
}
