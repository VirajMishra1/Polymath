import { NextResponse } from 'next/server';
import { getMarkets, parseJsonArraySafe } from '@/lib/polymarket-api';
import { fetchNewsForQuery, callGemini, type NewsItem } from '@/lib/news-utils';

export const revalidate = 300; // 5-min cache

const MOVE_THRESHOLD = 0.05;
const MAX_MOVERS = 10;

export interface Mover {
  marketId: string;
  question: string;
  currentPrice: number;
  change24h: number;
  direction: 'up' | 'down';
  volume24h: number;
  liquidity: number;
  why: string;
  headlines: NewsItem[];
}

export async function GET() {
  try {
    const rawMarkets = await getMarkets({
      limit: 200,
      active: true,
      closed: false,
      order: 'volume24hr',
      ascending: false,
    });

    // Polymarket returns outcomePrices as a JSON string (e.g. '["0.35","0.65"]'),
    // not a real array — parse defensively before reading.
    const markets = rawMarkets.map(m => {
      const outcomePrices = parseJsonArraySafe(m.outcomePrices as unknown as string);
      const yesPrice = parseFloat(outcomePrices[0] ?? '0.5');
      return {
        id: m.id,
        question: m.question,
        price: Number.isFinite(yesPrice) ? yesPrice : 0.5,
        change: m.oneDayPriceChange ?? 0,
        volume24h: m.volume24hr ?? 0,
        liquidity: parseFloat(m.liquidity ?? '0'),
      };
    });

    const sorted = [...markets].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    const movers = sorted.filter(m => Math.abs(m.change) >= MOVE_THRESHOLD).slice(0, MAX_MOVERS);

    if (movers.length === 0) {
      return NextResponse.json({
        movers: [],
        fallback: sorted.slice(0, 5).map(m => ({
          marketId: m.id,
          question: m.question,
          currentPrice: m.price,
          change24h: m.change,
        })),
      });
    }

    // Fetch headlines for all movers in parallel
    const newsResults = await Promise.all(
      movers.map(m => fetchNewsForQuery(m.question.slice(0, 80), 3))
    );

    // Single Gemini call for all "why" explanations
    const apiKey = process.env.GEMINI_API_KEY;
    const whyList: string[] = movers.map(() => '');

    if (apiKey) {
      const marketSummaries = movers.map((m, i) => {
        const headlines = newsResults[i]
          .map(n => `- ${JSON.stringify(n.title)} (${JSON.stringify(n.source)})`)
          .join('\n');
        const direction = m.change > 0 ? 'UP' : 'DOWN';
        const pct = Math.abs(m.change * 100).toFixed(1);
        return `Market ${i + 1}: ${JSON.stringify(m.question)} moved ${direction} ${pct}% (now at ${(m.price * 100).toFixed(0)}¢)\nHeadlines:\n${headlines || 'No headlines found'}`;
      }).join('\n\n');

      const prompt = `You are a prediction market analyst. For each market below, write ONE terse sentence (max 15 words) explaining WHY it moved based on the headlines. Focus on the specific news catalyst. Return ONLY a JSON array of strings, one per market, in order. No markdown, no extra text.

${marketSummaries}

Return format: ["reason 1", "reason 2", ...]`;

      try {
        const raw = await callGemini(prompt, apiKey);
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed: string[] = JSON.parse(cleaned);
        parsed.forEach((why, i) => { if (i < whyList.length) whyList[i] = why; });
      } catch {
        // Gemini failed — leave whys empty, headlines still useful
      }
    }

    const result: Mover[] = movers.map((m, i) => ({
      marketId: m.id,
      question: m.question,
      currentPrice: m.price,
      change24h: m.change,
      direction: m.change > 0 ? 'up' : 'down',
      volume24h: m.volume24h,
      liquidity: m.liquidity,
      why: whyList[i] || (newsResults[i][0]?.title ?? ''),
      headlines: newsResults[i],
    }));

    return NextResponse.json({ movers: result });
  } catch (err) {
    console.error('Movers error:', err);
    return NextResponse.json({ error: 'Failed to fetch movers' }, { status: 500 });
  }
}
