// Shared Google News RSS fetching — used by /api/news and /api/movers

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  url: string;
}

function parseRelativeTime(pubDateStr: string): string {
  try {
    const pubDate = new Date(pubDateStr);
    const diffMs = Date.now() - pubDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return pubDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'recently';
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function splitTitleAndSource(raw: string): { title: string; source: string } {
  const idx = raw.lastIndexOf(' - ');
  if (idx !== -1) {
    return { title: raw.slice(0, idx).trim(), source: raw.slice(idx + 3).trim() };
  }
  return { title: raw, source: 'News' };
}

export function parseGoogleNewsRSS(xml: string, max = 5): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let idx = 0;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const titleMatch =
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
      block.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    if (!titleMatch) continue;
    const rawTitle = decodeHtmlEntities(titleMatch[1].trim());
    const { title, source } = splitTitleAndSource(rawTitle);
    items.push({
      id: String(idx++),
      title,
      source,
      timestamp: pubDateMatch ? parseRelativeTime(pubDateMatch[1]) : 'recently',
      url: linkMatch ? linkMatch[1].trim() : '',
    });
    if (items.length >= max) break;
  }
  return items;
}

export async function fetchNewsForQuery(query: string, max = 5): Promise<NewsItem[]> {
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PolyTerminal/1.0)', Accept: 'application/rss+xml, */*' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseGoogleNewsRSS(xml, max);
  } catch {
    return [];
  }
}

const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];

export async function callGemini(prompt: string, apiKey: string): Promise<string> {
  let lastError = '';
  for (const model of GEMINI_MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }
    const body = await res.text().catch(() => '');
    lastError = `${model} ${res.status}`;
    // Only retry on 503 (overloaded) — quota errors won't be fixed by switching models of the same tier
    if (res.status !== 503) break;
  }
  throw new Error(lastError);
}
