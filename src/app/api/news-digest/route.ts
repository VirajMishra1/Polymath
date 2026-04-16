import { NextRequest, NextResponse } from 'next/server';
import { fetchNewsForQuery, callGemini, type NewsItem } from '@/lib/news-utils';

export interface NewsDigest {
  summary: string;
  netDirection: 'BULLISH' | 'BEARISH' | 'MIXED' | 'QUIET';
  themes: { label: string; sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; count: number }[];
  timeline: { timestamp: string; headline: string; significance: 'HIGH' | 'MEDIUM' | 'LOW' }[];
  catalystsToWatch: string[];
  headlines: NewsItem[];
}

// Multi-window cache: bucket by question only (digests change slowly)
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min
const digestCache = new Map<string, { at: number; digest: NewsDigest }>();

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json() as { question: string };

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'question required' }, { status: 400 });
    }
    const safeQuestion = question.slice(0, 300);

    const cached = digestCache.get(safeQuestion);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return NextResponse.json({ digest: cached.digest, cached: true });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini not configured' }, { status: 500 });
    }

    // `when:30d` scopes Google News to the past 30 days
    const extended = `${safeQuestion.slice(0, 100)} when:30d`;
    const headlines = await fetchNewsForQuery(extended, 20);

    if (headlines.length < 3) {
      return NextResponse.json({
        digest: {
          summary: 'Not enough news coverage in the last 30 days to build a meaningful digest.',
          netDirection: 'QUIET' as const,
          themes: [],
          timeline: [],
          catalystsToWatch: [],
          headlines,
        },
      });
    }

    const headlineText = headlines
      .map((h, i) => `${i + 1}. ${JSON.stringify(h.title)} — ${JSON.stringify(h.source)} (${JSON.stringify(h.timestamp)})`)
      .join('\n');

    const prompt = `You are a prediction market analyst. Synthesize the last 30 days of news into a research digest for this market.

MARKET QUESTION: ${JSON.stringify(safeQuestion)}

HEADLINES (newest first):
${headlineText}

Produce ONLY valid JSON (no markdown, no extra text):
{
  "summary": "<3-4 sentences summarizing the narrative arc over the past 30 days, highlighting what's changed>",
  "netDirection": "<BULLISH|BEARISH|MIXED|QUIET — BULLISH means recent news supports YES resolving, BEARISH supports NO, MIXED is conflicting signal, QUIET is low-information>",
  "themes": [
    {"label": "<3-6 word theme>", "sentiment": "<BULLISH|BEARISH|NEUTRAL>", "count": <approx # of headlines supporting this theme>}
  ],
  "timeline": [
    {"timestamp": "<use the timestamp string from the headline>", "headline": "<the most significant headline for this period>", "significance": "<HIGH|MEDIUM|LOW>"}
  ],
  "catalystsToWatch": ["<upcoming event or decision that would resolve ambiguity>", ...]
}

Rules:
- themes: 2–5 entries, ordered by count
- timeline: 3–6 entries, chronological oldest-first if timestamps are available
- catalystsToWatch: 2–4 entries, forward-looking
- Do NOT mention prices or market probabilities — focus on the underlying narrative`;

    try {
      const raw = await callGemini(prompt, apiKey);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as Omit<NewsDigest, 'headlines'>;

      const digest: NewsDigest = {
        summary: parsed.summary,
        netDirection: parsed.netDirection,
        themes: Array.isArray(parsed.themes) ? parsed.themes.slice(0, 6) : [],
        timeline: Array.isArray(parsed.timeline) ? parsed.timeline.slice(0, 8) : [],
        catalystsToWatch: Array.isArray(parsed.catalystsToWatch) ? parsed.catalystsToWatch.slice(0, 5) : [],
        headlines,
      };

      digestCache.set(safeQuestion, { at: Date.now(), digest });
      return NextResponse.json({ digest });
    } catch (llmErr) {
      console.error('News digest LLM error:', llmErr);
      return NextResponse.json({
        digest: {
          summary: 'AI digest temporarily unavailable. Review headlines manually.',
          netDirection: 'QUIET' as const,
          themes: [],
          timeline: [],
          catalystsToWatch: [],
          headlines,
        },
      });
    }
  } catch (err) {
    console.error('News digest error:', err);
    return NextResponse.json({ error: 'Failed to build news digest' }, { status: 500 });
  }
}
