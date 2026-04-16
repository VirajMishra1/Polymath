'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Scale, TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ArbOpportunity } from '@/app/api/arbitrage/route';

interface ArbResponse {
  opportunities: ArbOpportunity[];
  scanned: number;
  timestamp: number;
}

function formatVolume(vol: number) {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(2)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

function formatPrice(p: number) {
  return `${(p * 100).toFixed(1)}¢`;
}

export default function ArbitragePage() {
  const [data, setData] = useState<ArbResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/arbitrage');
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Scan failed');
        return;
      }
      setData(json);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="p-4 max-w-5xl mx-auto font-mono">
      <div className="border border-border bg-black mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Scale className="w-4 h-4 text-terminal-amber" />
            <h1 className="text-sm font-bold text-terminal-amber uppercase tracking-widest">
              Cross-Market Arbitrage Scanner
            </h1>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className={cn(
              'px-3 py-1 text-[11px] font-mono border transition-all flex items-center gap-2',
              loading
                ? 'border-terminal-amber/50 text-terminal-amber/50 animate-pulse'
                : 'border-border text-muted-foreground hover:text-terminal-amber hover:border-terminal-amber/50'
            )}
          >
            <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
            {loading ? 'Scanning' : 'Refresh'}
          </button>
        </div>
        <div className="px-4 py-3">
          <p className="text-[11px] text-muted-foreground">
            Scans multi-outcome events where YES prices across all outcomes should sum to 100¢.
            Flags events deviating by ≥2% — overpriced sums suggest selling the basket; underpriced sums suggest buying it.
            Ranked by size × √liquidity to prioritize tradeable edges.
          </p>
          {data && (
            <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground font-mono">
              <span>Scanned: <span className="text-terminal-green">{data.scanned}</span> events</span>
              <span>Found: <span className="text-terminal-amber">{data.opportunities.length}</span> opportunities</span>
              <span>Updated: {new Date(data.timestamp).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="border border-terminal-red bg-black p-4 text-sm text-terminal-red">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="border border-border bg-black p-8 text-center">
          <RefreshCw className="w-6 h-6 text-terminal-amber mx-auto mb-3 animate-spin" />
          <p className="text-sm text-muted-foreground">Scanning markets...</p>
        </div>
      )}

      {data && data.opportunities.length === 0 && (
        <div className="border border-border bg-black p-8 text-center">
          <p className="text-sm text-muted-foreground">No arbitrage opportunities detected.</p>
          <p className="text-[11px] text-muted-foreground mt-2">
            All scanned multi-market events price within 2% of their expected sum.
          </p>
        </div>
      )}

      {data && data.opportunities.length > 0 && (
        <div className="space-y-3">
          {data.opportunities.map(opp => {
            const isOpen = expanded.has(opp.eventId);
            const isOver = opp.direction === 'OVERPRICED';
            const arbBps = Math.abs(opp.arbPct * 100).toFixed(1);

            return (
              <div key={opp.eventId} className="border border-border bg-black">
                <button
                  onClick={() => toggle(opp.eventId)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {isOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 border font-mono flex items-center gap-1',
                        isOver
                          ? 'text-terminal-red border-terminal-red/50'
                          : 'text-terminal-green border-terminal-green/50'
                      )}>
                        {isOver ? <TrendingDown className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
                        {opp.direction}
                      </span>
                      <span className={cn(
                        'text-xs font-bold',
                        isOver ? 'text-terminal-red' : 'text-terminal-green'
                      )}>
                        {isOver ? '+' : '-'}{arbBps}%
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        sum={formatPrice(opp.sumYesPrices)} · {opp.marketsCount} markets
                      </span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{opp.eventTitle}</p>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                      <span>24h Vol: <span className="text-terminal-green">{formatVolume(opp.totalVolume)}</span></span>
                      <span>Liquidity: <span className="text-terminal-green">{formatVolume(opp.totalLiquidity)}</span></span>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border">
                    <div className="px-4 py-2 bg-white/[0.02] border-b border-border">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {isOver ? (
                          <>Edge: sum is <span className="text-terminal-red">{arbBps}% above</span> 100¢ — selling YES on each market captures the overpricing</>
                        ) : (
                          <>Edge: sum is <span className="text-terminal-green">{arbBps}% below</span> 100¢ — buying YES on each market captures the underpricing</>
                        )}
                      </div>
                    </div>
                    <div className="divide-y divide-border">
                      {opp.markets
                        .slice()
                        .sort((a, b) => b.yesPrice - a.yesPrice)
                        .map(m => (
                          <Link
                            key={m.id}
                            href={`/market/${m.id}`}
                            className="flex items-center justify-between px-4 py-2 hover:bg-white/5 transition-colors"
                          >
                            <span className="text-xs text-terminal-green hover:glow-text line-clamp-1 flex-1 mr-3">
                              {m.question}
                            </span>
                            <div className="flex items-center gap-4 flex-shrink-0">
                              <span className="text-[10px] text-muted-foreground">
                                {formatVolume(m.volume24h)}
                              </span>
                              <span className="text-xs font-bold text-foreground w-14 text-right">
                                {formatPrice(m.yesPrice)}
                              </span>
                            </div>
                          </Link>
                        ))}
                    </div>
                    <div className="px-4 py-2 border-t border-border text-[10px] text-muted-foreground">
                      <Link href={`/event/${opp.eventSlug}`} className="hover:text-terminal-amber">
                        → View full event
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 border border-border bg-black p-3">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">How this works</div>
        <div className="text-[11px] text-muted-foreground space-y-1">
          <p>Multi-outcome events (e.g. &ldquo;Who wins the 2028 election?&rdquo;) split into N mutually-exclusive YES markets.</p>
          <p>Mathematically, the YES prices must sum to 100¢. Deviations represent market inefficiencies.</p>
          <p className="text-terminal-amber/80">⚠ Real arbitrage requires accounting for bid-ask spread, gas, and Polymarket&apos;s 2% fee on winnings.</p>
        </div>
      </div>
    </div>
  );
}
