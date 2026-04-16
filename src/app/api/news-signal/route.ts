import { NextRequest, NextResponse } from 'next/server';
import { fetchNewsForQuery, callGemini } from '@/lib/news-utils';

export interface NewsSignal {
  currentPrice: number;
  impliedProbability: number | null;
  gap: number | null;
  signal: 'OVERPRICED' | 'UNDERPRICED' | 'FAIRLY_PRICED' | 'INSUFFICIENT_DATA';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
  headlines: { title: string; source: string; timestamp: string; url: string; sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' }[];
}

export async function POST(req: NextRequest) {
  try {
    const { question, currentPrice } = await req.json() as { question: string; currentPrice: number };

    if (!question || typeof currentPrice !== 'number') {
      return NextResponse.json({ error: 'question and currentPrice required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini not configured' }, { status: 500 });
    }

    const headlines = await fetchNewsForQuery(question.slice(0, 100), 5);

    if (headlines.length === 0) {
      const signal: NewsSignal = {
        currentPrice,
        impliedProbability: null,
        gap: null,
        signal: 'INSUFFICIENT_DATA',
        confidence: 'LOW',
        reasoning: 'No recent news found for this market.',
        headlines: [],
      };
      return NextResponse.json({ signal });
    }

    const headlineText = headlines.map((h, i) => `${i + 1}. "${h.title}" — ${h.source} (${h.timestamp})`).join('\n');
    const currentPct = (currentPrice * 100).toFixed(1);

    const prompt = `You are a quantitative prediction market analyst. Analyze whether this Polymarket prediction is correctly priced based on recent news.

MARKET QUESTION: "${question}"
CURRENT POLYMARKET PRICE: ${currentPct}¢ (implies ${currentPct}% probability of YES)

RECENT HEADLINES:
${headlineText}

Task: Estimate what probability the NEWS implies for this question resolving YES, and assess whether the market is correctly priced.

Respond ONLY with valid JSON (no markdown, no explanation outside JSON):
{
  "impliedProbability": <number 0-1, your estimate of what the news implies>,
  "signal": "<OVERPRICED|UNDERPRICED|FAIRLY_PRICED|INSUFFICIENT_DATA>",
  "confidence": "<HIGH|MEDIUM|LOW>",
  "reasoning": "<2-3 sentences max, explain the gap or lack thereof>",
  "headlineSentiments": [<"BULLISH"|"BEARISH"|"NEUTRAL" for each headline in order>]
}

OVERPRICED = market price > what news implies (sell signal)
UNDERPRICED = market price < what news implies (buy signal)
FAIRLY_PRICED = within 5 percentage points
INSUFFICIENT_DATA = headlines don't speak to this question`;

    let signal: NewsSignal;

    try {
      const raw = await callGemini(prompt, apiKey);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed: {
        impliedProbability: number;
        signal: NewsSignal['signal'];
        confidence: NewsSignal['confidence'];
        reasoning: string;
        headlineSentiments: ('BULLISH' | 'BEARISH' | 'NEUTRAL')[];
      } = JSON.parse(cleaned);

      signal = {
        currentPrice,
        impliedProbability: parsed.impliedProbability,
        gap: parsed.impliedProbability != null ? parsed.impliedProbability - currentPrice : null,
        signal: parsed.signal,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        headlines: headlines.map((h, i) => ({
          title: h.title,
          source: h.source,
          timestamp: h.timestamp,
          url: h.url,
          sentiment: parsed.headlineSentiments?.[i] ?? 'NEUTRAL',
        })),
      };
    } catch {
      // Gemini failed — return headlines without AI analysis
      signal = {
        currentPrice,
        impliedProbability: null,
        gap: null,
        signal: 'INSUFFICIENT_DATA',
        confidence: 'LOW',
        reasoning: 'AI analysis unavailable. Review headlines manually.',
        headlines: headlines.map(h => ({
          title: h.title,
          source: h.source,
          timestamp: h.timestamp,
          url: h.url,
          sentiment: 'NEUTRAL' as const,
        })),
      };
    }

    return NextResponse.json({ signal });
  } catch (err) {
    console.error('News signal error:', err);
    return NextResponse.json({ error: 'Failed to analyze news signal' }, { status: 500 });
  }
}
