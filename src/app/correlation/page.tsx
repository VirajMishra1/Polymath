'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RefreshCw, GitMerge, X, Search, AlertTriangle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CorrelationMarket {
  id: string;
  question: string;
  price: number;
  volume24h: number;
}

interface MispricedPair {
  market1: string;
  market2: string;
  question1: string;
  question2: string;
  price1: number;
  price2: number;
  correlation: number;
  impliedRatio: number;
  actualRatio: number;
  divergence: number;
  edge: string;
}

interface RollingPair {
  i: number;
  j: number;
  overall: number;
  recent: number;
  decoupling: boolean;
  series: number[];
}

interface CorrelationResult {
  markets: CorrelationMarket[];
  matrix: number[][];
  mispricedPairs: MispricedPair[];
  rollingPairs?: RollingPair[];
}

function Sparkline({ series, stroke }: { series: number[]; stroke: string }) {
  if (series.length < 2) return null;
  const width = 80;
  const height = 20;
  // Correlation is in [-1, 1]; pin the y-axis to that range so sparklines are comparable
  const yFor = (v: number) => height - ((v + 1) / 2) * height;
  const xFor = (i: number) => (i / (series.length - 1)) * width;
  const points = series.map((v, i) => `${xFor(i).toFixed(1)},${yFor(v).toFixed(1)}`).join(' ');
  const midY = yFor(0);
  return (
    <svg width={width} height={height} className="inline-block">
      <line x1={0} y1={midY} x2={width} y2={midY} stroke="currentColor" strokeOpacity={0.2} strokeDasharray="2,2" />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={1.25} />
    </svg>
  );
}

function corrColor(corr: number): string {
  if (corr >= 0.8) return 'text-terminal-green';
  if (corr >= 0.5) return 'text-terminal-amber';
  if (corr >= 0) return 'text-muted-foreground';
  if (corr >= -0.5) return 'text-orange-400';
  return 'text-terminal-red';
}

function corrBg(corr: number): string {
  const abs = Math.abs(corr);
  if (abs >= 0.8) return corr >= 0 ? 'bg-terminal-green/20' : 'bg-terminal-red/20';
  if (abs >= 0.5) return corr >= 0 ? 'bg-terminal-amber/10' : 'bg-orange-400/10';
  return 'bg-black/30';
}

function formatPrice(p: number) {
  return `${(p * 100).toFixed(0)}¢`;
}

const EXAMPLE_PAIRS = [
  { label: 'Trump win vs GOP Senate', ids: '' },
];

export default function CorrelationPage() {
  const [inputIds, setInputIds] = useState('');
  const [result, setResult] = useState<CorrelationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runCorrelation() {
    const ids = inputIds
      .split(/[\n,\s]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (ids.length < 2) {
      setError('Enter at least 2 market IDs');
      return;
    }
    if (ids.length > 6) {
      setError('Maximum 6 markets at once');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/correlation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketIds: ids }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Correlation failed');
        return;
      }
      setResult(data);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-5xl mx-auto font-mono">
      {/* Header */}
      <div className="border border-border bg-black mb-4">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <GitMerge className="w-4 h-4 text-cyan-400" />
          <h1 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">
            Market Correlation Analysis
          </h1>
        </div>
        <div className="px-4 py-3">
          <p className="text-[11px] text-muted-foreground mb-3">
            Paste 2–6 Polymarket market IDs to compute their price correlation and detect potential mispricings.
            Find IDs from the URL: <span className="text-cyan-400/70">polymath-app.vercel.app/market/<strong>[ID]</strong></span>
          </p>

          <div className="flex gap-2">
            <textarea
              value={inputIds}
              onChange={e => setInputIds(e.target.value)}
              placeholder={'Market IDs, one per line or comma-separated\ne.g.\n507891\n508123\n509456'}
              rows={4}
              className="flex-1 bg-black border border-border text-sm text-terminal-green font-mono p-2 placeholder:text-muted-foreground/50 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={runCorrelation}
                disabled={loading}
                className={cn(
                  'px-4 py-2 text-xs font-bold uppercase font-mono flex items-center gap-2 transition-all',
                  loading
                    ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-500 animate-pulse'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                )}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Running
                  </>
                ) : (
                  <>
                    <Search className="w-3 h-3" />
                    Analyze
                  </>
                )}
              </button>
              {inputIds && (
                <button
                  onClick={() => { setInputIds(''); setResult(null); setError(null); }}
                  className="px-4 py-2 text-xs font-mono border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-all flex items-center gap-2"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {error && (
            <p className="text-terminal-red text-[11px] mt-2 font-mono">{error}</p>
          )}
        </div>
      </div>

      {/* How to find IDs */}
      {!result && !loading && (
        <div className="border border-border bg-black p-4 mb-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">How to use</div>
          <ol className="space-y-1 text-[11px] text-muted-foreground">
            <li>1. Open any market on Polymath — the URL ends in <code className="text-cyan-400">/market/[ID]</code></li>
            <li>2. Copy the numeric ID from multiple related markets</li>
            <li>3. Paste them above (one per line or comma-separated)</li>
            <li>4. Click Analyze — we'll compute 1-week Pearson correlation and detect mispriced pairs</li>
          </ol>
          <div className="mt-3 text-[10px] text-muted-foreground">
            <span className="text-terminal-amber">Edge signal: </span>
            Correlation ≥ 0.7 + current ratio deviates ≥15% from historical mean = potential arb
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Market legend */}
          <div className="border border-border bg-black">
            <div className="px-4 py-2 border-b border-border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Markets Analyzed</span>
            </div>
            <div className="divide-y divide-border">
              {result.markets.map((m, i) => (
                <div key={m.id} className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] text-cyan-400 border border-cyan-500/50 px-1.5 py-0.5 flex-shrink-0">
                      M{i + 1}
                    </span>
                    <Link
                      href={`/market/${m.id}`}
                      className="text-sm text-terminal-green hover:glow-text transition-all line-clamp-1"
                    >
                      {m.question}
                    </Link>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground flex-shrink-0 ml-4">
                    {formatPrice(m.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Correlation matrix */}
          <div className="border border-border bg-black">
            <div className="px-4 py-2 border-b border-border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Correlation Matrix (1-week price history)</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="text-sm font-mono">
                <thead>
                  <tr>
                    <th className="w-10" />
                    {result.markets.map((_, i) => (
                      <th key={i} className="w-16 text-center text-[10px] text-cyan-400 pb-2">M{i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.matrix.map((row, i) => (
                    <tr key={i}>
                      <td className="text-[10px] text-cyan-400 pr-3 text-right">M{i + 1}</td>
                      {row.map((corr, j) => (
                        <td key={j} className="w-16 text-center py-1">
                          <span className={cn(
                            'inline-block w-14 py-1 text-xs font-bold',
                            i === j ? 'text-muted-foreground/50' : corrBg(corr),
                            i === j ? '' : corrColor(corr)
                          )}>
                            {i === j ? '—' : corr.toFixed(2)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center gap-4 mt-3 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-terminal-green/20 inline-block" /> Strong positive (≥0.8)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-terminal-amber/10 inline-block" /> Moderate (0.5–0.8)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-terminal-red/20 inline-block" /> Strong negative (≤-0.8)</span>
              </div>
            </div>
          </div>

          {/* Rolling correlation sparklines */}
          {result.rollingPairs && result.rollingPairs.length > 0 && (
            <div className="border border-border bg-black">
              <div className="px-4 py-2 border-b border-border flex items-center gap-2">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] text-cyan-400 uppercase tracking-wider">
                  Rolling Correlation (sliding window)
                </span>
              </div>
              <div className="divide-y divide-border">
                {result.rollingPairs
                  .slice()
                  .sort((a, b) => Number(b.decoupling) - Number(a.decoupling) || Math.abs(b.overall) - Math.abs(a.overall))
                  .map((rp, k) => {
                    const stroke = rp.decoupling
                      ? '#ff6b6b'
                      : rp.overall >= 0
                      ? '#00ff41'
                      : '#ffa500';
                    return (
                      <div key={k} className="flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[10px] text-cyan-400 border border-cyan-500/50 px-1.5 py-0.5 flex-shrink-0">
                            M{rp.i + 1}×M{rp.j + 1}
                          </span>
                          {rp.decoupling && (
                            <span className="text-[9px] text-terminal-red border border-terminal-red/50 px-1.5 py-0.5 font-bold uppercase">
                              Decoupling
                            </span>
                          )}
                          <div className={cn('flex-shrink-0', corrColor(rp.overall))}>
                            <Sparkline series={rp.series} stroke={stroke} />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono flex-shrink-0">
                          <span className="text-muted-foreground">
                            avg: <span className={corrColor(rp.overall)}>{rp.overall.toFixed(2)}</span>
                          </span>
                          <span className="text-muted-foreground">
                            recent: <span className={corrColor(rp.recent)}>{rp.recent.toFixed(2)}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="px-4 py-2 border-t border-border text-[9px] text-muted-foreground">
                Decoupling pairs (recent window &gt;0.30 below overall) may signal regime change or a pair trade reverting.
              </div>
            </div>
          )}

          {/* Mispriced pairs */}
          {result.mispricedPairs.length > 0 ? (
            <div className="border border-terminal-amber bg-black">
              <div className="px-4 py-2 border-b border-terminal-amber flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-terminal-amber" />
                <span className="text-[10px] text-terminal-amber uppercase tracking-wider">
                  Potential Mispricings ({result.mispricedPairs.length})
                </span>
              </div>
              <div className="divide-y divide-border">
                {result.mispricedPairs.map((pair, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 border font-mono',
                        pair.divergence > 0 ? 'text-terminal-red border-terminal-red/50' : 'text-terminal-green border-terminal-green/50'
                      )}>
                        {pair.divergence > 0 ? 'M1 OVERPRICED' : 'M1 UNDERPRICED'}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        corr={pair.correlation.toFixed(2)} · divergence={Math.abs(pair.divergence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-terminal-amber font-mono mb-2">{pair.edge}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border border-border p-2">
                        <Link href={`/market/${pair.market1}`} className="text-[10px] text-terminal-green hover:glow-text line-clamp-2 block mb-1">
                          {pair.question1}
                        </Link>
                        <span className="text-xs font-bold text-foreground">{formatPrice(pair.price1)}</span>
                      </div>
                      <div className="border border-border p-2">
                        <Link href={`/market/${pair.market2}`} className="text-[10px] text-terminal-green hover:glow-text line-clamp-2 block mb-1">
                          {pair.question2}
                        </Link>
                        <span className="text-xs font-bold text-foreground">{formatPrice(pair.price2)}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-[9px] text-muted-foreground font-mono">
                      Historical price ratio: {pair.impliedRatio.toFixed(3)} · Current: {pair.actualRatio.toFixed(3)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-border bg-black p-4 text-center">
              <p className="text-sm text-muted-foreground">No mispriced pairs detected.</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Mispricing threshold: correlation ≥ 0.70 and ratio deviation ≥ 15%
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
