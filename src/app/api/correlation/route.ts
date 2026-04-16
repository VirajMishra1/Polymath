import { NextRequest, NextResponse } from 'next/server';
import { getMarketById, getPriceHistory, parseJsonArraySafe } from '@/lib/polymarket-api';

function getYesPrice(m: { outcomePrices?: string | string[] }): number {
  const arr = parseJsonArraySafe(m.outcomePrices as unknown as string);
  const v = parseFloat(arr[0] ?? '0.5');
  return Number.isFinite(v) ? v : 0.5;
}

export const revalidate = 0; // User-driven, don't cache

interface PricePoint { t: number; p: number }

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  const meanA = a.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const meanB = b.slice(0, n).reduce((s, v) => s + v, 0) / n;
  let num = 0, varA = 0, varB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    varA += da * da;
    varB += db * db;
  }
  const denom = Math.sqrt(varA * varB);
  return denom === 0 ? 0 : num / denom;
}

// Align two price series to common timestamps via linear interpolation
function alignSeries(a: PricePoint[], b: PricePoint[]): { a: number[]; b: number[]; t: number[] } {
  if (a.length === 0 || b.length === 0) return { a: [], b: [], t: [] };

  // Use b's timestamps as reference, find matching prices in a
  const aMap = new Map(a.map(p => [p.t, p.p]));
  const aligned: { a: number; b: number; t: number }[] = [];

  for (const bPoint of b) {
    const aPrice = aMap.get(bPoint.t);
    if (aPrice !== undefined) {
      aligned.push({ a: aPrice, b: bPoint.p, t: bPoint.t });
    }
  }

  // If no exact matches, fall back to positional alignment using b's timestamps
  if (aligned.length < 3) {
    const minLen = Math.min(a.length, b.length);
    return {
      a: a.slice(0, minLen).map(p => p.p),
      b: b.slice(0, minLen).map(p => p.p),
      t: b.slice(0, minLen).map(p => p.t),
    };
  }

  return { a: aligned.map(x => x.a), b: aligned.map(x => x.b), t: aligned.map(x => x.t) };
}

// Rolling Pearson over a sliding window. Returns one correlation per end-of-window.
function rollingPearson(a: number[], b: number[], window: number): { idx: number; corr: number }[] {
  const n = Math.min(a.length, b.length);
  if (n < window) return [];
  const out: { idx: number; corr: number }[] = [];
  for (let end = window; end <= n; end++) {
    const wa = a.slice(end - window, end);
    const wb = b.slice(end - window, end);
    out.push({ idx: end - 1, corr: pearson(wa, wb) });
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const { marketIds } = await req.json() as { marketIds: string[] };

    if (!Array.isArray(marketIds) || marketIds.length < 2 || marketIds.length > 6) {
      return NextResponse.json({ error: 'Provide 2-6 market IDs' }, { status: 400 });
    }

    // Fetch market metadata + price history in parallel
    const results = await Promise.all(
      marketIds.map(async (id) => {
        try {
          const market = await getMarketById(id);
          if (!market) return { id, market: null, history: [] };
          // clobTokenIds comes back as a JSON string, not a real array
          const tokenId = parseJsonArraySafe(market.clobTokenIds as unknown as string)[0];
          if (!tokenId) return { id, market, history: [] };
          const history = await getPriceHistory(tokenId, '1w');
          return { id, market, history };
        } catch {
          return { id, market: null, history: [] };
        }
      })
    );

    const valid = results.filter(r => r.market && r.history.length >= 5);
    if (valid.length < 2) {
      return NextResponse.json({ error: 'Not enough data for correlation' }, { status: 422 });
    }

    // Build correlation matrix
    const n = valid.length;
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    const mispricedPairs: {
      market1: string; market2: string;
      question1: string; question2: string;
      price1: number; price2: number;
      correlation: number;
      impliedRatio: number;
      actualRatio: number;
      divergence: number;
      edge: string;
    }[] = [];

    const rollingPairs: {
      i: number;
      j: number;
      overall: number;
      recent: number;
      decoupling: boolean;
      series: number[];
    }[] = [];

    for (let i = 0; i < n; i++) {
      matrix[i][i] = 1;
      for (let j = i + 1; j < n; j++) {
        const { a: seriesA, b: seriesB } = alignSeries(valid[i].history, valid[j].history);
        const corr = pearson(seriesA, seriesB);
        matrix[i][j] = corr;
        matrix[j][i] = corr;

        // Rolling correlation sparkline: 1/3 of series as window (min 5, max 24)
        const window = Math.max(5, Math.min(24, Math.floor(seriesA.length / 3)));
        if (seriesA.length >= window + 3) {
          const rolling = rollingPearson(seriesA, seriesB, window);
          if (rolling.length >= 3) {
            const recentWindow = rolling.slice(-Math.ceil(rolling.length / 4));
            const recentAvg = recentWindow.reduce((s, v) => s + v.corr, 0) / recentWindow.length;
            // Decoupling: overall strongly correlated but the recent window broke down
            const decoupling = Math.abs(corr) >= 0.6 && Math.abs(recentAvg) < Math.abs(corr) - 0.3;
            rollingPairs.push({
              i,
              j,
              overall: corr,
              recent: recentAvg,
              decoupling,
              series: rolling.map(r => r.corr),
            });
          }
        }

        // Detect mispricing: high correlation but prices diverge from historical ratio
        if (Math.abs(corr) >= 0.7 && seriesA.length >= 10) {
          const historicalRatios = seriesA.map((a, k) => a / (seriesB[k] + 0.001));
          const meanRatio = historicalRatios.reduce((s, v) => s + v, 0) / historicalRatios.length;
          const p1 = getYesPrice(valid[i].market!);
          const p2 = getYesPrice(valid[j].market!);
          const actualRatio = p1 / (p2 + 0.001);
          const divergence = (actualRatio - meanRatio) / (meanRatio + 0.001);

          if (Math.abs(divergence) >= 0.15) {
            const edge = corr > 0
              ? (divergence > 0 ? `${valid[i].market!.question.slice(0, 40)} looks OVERPRICED vs ${valid[j].market!.question.slice(0, 40)}` : `${valid[i].market!.question.slice(0, 40)} looks UNDERPRICED vs ${valid[j].market!.question.slice(0, 40)}`)
              : (divergence > 0 ? 'Inverse relationship: divergence may revert' : 'Inverse relationship: convergence expected');

            mispricedPairs.push({
              market1: valid[i].id,
              market2: valid[j].id,
              question1: valid[i].market!.question,
              question2: valid[j].market!.question,
              price1: p1,
              price2: p2,
              correlation: corr,
              impliedRatio: meanRatio,
              actualRatio,
              divergence,
              edge,
            });
          }
        }
      }
    }

    return NextResponse.json({
      markets: valid.map(v => ({
        id: v.id,
        question: v.market!.question,
        price: getYesPrice(v.market!),
        volume24h: v.market!.volume24hr,
      })),
      matrix,
      mispricedPairs: mispricedPairs.sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence)),
      rollingPairs,
    });
  } catch (err) {
    console.error('Correlation error:', err);
    return NextResponse.json({ error: 'Correlation analysis failed' }, { status: 500 });
  }
}
