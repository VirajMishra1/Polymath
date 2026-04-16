import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/news-utils';

export async function POST(request: NextRequest) {
  try {
    const { title, source } = await request.json() as { title?: string; source?: string };

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const safeTitle = title.slice(0, 500);
    const safeSource = typeof source === 'string' ? source.slice(0, 100) : 'Unknown';

    const prompt = `You are a Bloomberg Terminal AI assistant.
Provide a concise, professional 2-3 sentence summary of the following news headline for a high-stakes trader.
Headline: ${JSON.stringify(safeTitle)}
Source: ${JSON.stringify(safeSource)}

The summary should be objective, focus on market impact or key facts, and maintain a terminal aesthetic (uppercase keywords where appropriate).`;

    try {
      const summary = await callGemini(prompt, apiKey);
      return NextResponse.json({ summary: summary || 'Summary unavailable.' });
    } catch (err) {
      console.error('Gemini call failed in summarize:', err);
      return NextResponse.json({ summary: 'Summary temporarily unavailable.' });
    }
  } catch (error) {
    console.error('Summarization Error:', error);
    return NextResponse.json({ error: 'Failed to summarize article' }, { status: 500 });
  }
}
