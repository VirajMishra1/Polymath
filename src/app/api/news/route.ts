import { NextRequest, NextResponse } from 'next/server';

interface NewsItem {
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

// Google News RSS title format: "Article Title - Source Name"
// Extract source from the trailing " - Source Name" suffix
function splitTitleAndSource(raw: string): { title: string; source: string } {
  const idx = raw.lastIndexOf(' - ');
  if (idx !== -1) {
    return {
      title: raw.slice(0, idx).trim(),
      source: raw.slice(idx + 3).trim(),
    };
  }
  return { title: raw, source: 'News' };
}

function parseGoogleNewsRSS(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let idx = 0;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    // Title — Google News uses plain text (no CDATA)
    const titleMatch =
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
      block.match(/<title>([\s\S]*?)<\/title>/);

    // Link is a google redirect URL
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);

    // Pub date
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

    if (items.length >= 12) break;
  }

  return items;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json({ news: [] });
  }

  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PolyTerminal/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      next: { revalidate: 300 }, // cache 5 min
    });

    if (!response.ok) {
      console.error(`Google News RSS error: ${response.status}`);
      return NextResponse.json({ news: [] });
    }

    const xml = await response.text();
    const news = parseGoogleNewsRSS(xml);

    return NextResponse.json({ news });
  } catch (error) {
    console.error('News fetch error:', error);
    return NextResponse.json({ news: [] });
  }
}
