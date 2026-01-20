import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = 'AIzaSyApUXdIIUx-pr_gO2XEbPUGhSglsgAUnhs';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(request: NextRequest) {
  try {
    const { title, source, url } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const prompt = `You are a Bloomberg Terminal AI assistant. 
    Provide a concise, professional 2-3 sentence summary of the following news headline for a high-stakes trader.
    Headline: "${title}"
    Source: ${source}
    
    The summary should be objective, focus on market impact or key facts, and maintain a terminal aesthetic (uppercase keywords where appropriate).`;

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error('Failed to fetch from Gemini API');
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Summary unavailable.';

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarization Error:', error);
    return NextResponse.json({ error: 'Failed to summarize article' }, { status: 500 });
  }
}
