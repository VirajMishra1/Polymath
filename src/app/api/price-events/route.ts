import { NextRequest, NextResponse } from 'next/server';
import { detectPriceEvents, getArticlesForMarket } from '@/lib/market-articles';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { marketId, priceHistory, targetTimestamp } = body;

    if (!marketId || !priceHistory) {
      return NextResponse.json({ error: 'marketId and priceHistory required' }, { status: 400 });
    }

    const formattedHistory = priceHistory.map((p: { timestamp?: number; t?: number; price?: number; p?: number }) => ({
      timestamp: p.timestamp || p.t,
      price: p.price || p.p
    }));

    const events = detectPriceEvents(formattedHistory, marketId);

    if (targetTimestamp) {
      const targetEvent = events.find(e => Math.abs(e.timestamp - targetTimestamp) < 3600);
      if (targetEvent) {
        return NextResponse.json({
          success: true,
          event: targetEvent,
          allArticles: getArticlesForMarket(marketId)
        });
      }
    }

    return NextResponse.json({
      success: true,
      events,
      totalEvents: events.length,
      dips: events.filter(e => e.type === 'dip').length,
      spikes: events.filter(e => e.type === 'spike').length
    });

  } catch (error) {
    console.error('Price events analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze price events' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const marketId = searchParams.get('marketId');

  if (!marketId) {
    return NextResponse.json({ error: 'marketId required' }, { status: 400 });
  }

  const articles = getArticlesForMarket(marketId);
  
  return NextResponse.json({
    success: true,
    marketId,
    articles,
    totalArticles: articles.length
  });
}
