'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, RefreshCw, Zap, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Mover } from '@/app/api/movers/route';

function formatChange(change: number) {
  const pct = (Math.abs(change) * 100).toFixed(1);
  return `${change > 0 ? '+' : '-'}${pct}%`;
}

function formatPrice(p: number) {
  return `${(p * 100).toFixed(0)}¢`;
}

function formatVolume(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export default function MoversPage() {
  const [movers, setMovers] = useState<Mover[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchMovers() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/movers');
      const data = await res.json();
      setMovers(data.movers ?? []);
      setLastUpdated(new Date());
    } catch {
      // keep stale data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchMovers(); }, []);

  return (
    <div className="p-4 max-w-7xl mx-auto font-mono">
      {/* Header */}
      <div className="border border-border bg-black mb-1">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-terminal-amber" />
            <h1 className="text-sm font-bold text-terminal-amber uppercase tracking-widest glow-text">
              Market Movers — 24H
            </h1>
            <span className="text-[10px] text-muted-foreground border border-border px-2 py-0.5">
              {movers.length} movers &gt;5%
            </span>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-[10px] text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchMovers}
              disabled={refreshing}
              className="p-1 hover:bg-terminal-green/10 transition-colors"
            >
              <RefreshCw className={cn('w-4 h-4 text-terminal-green', refreshing && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-4 px-4 py-2 border-b border-border bg-black/50">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Market</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-right">Price</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-right">24H Chg</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-right">Vol 24H</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-right">Liq</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="border border-border bg-black p-12 flex items-center justify-center gap-3">
          <RefreshCw className="w-5 h-5 text-terminal-green animate-spin" />
          <span className="text-terminal-green text-sm">Scanning markets for significant moves...</span>
        </div>
      )}

      {/* No movers */}
      {!loading && movers.length === 0 && (
        <div className="border border-border bg-black p-12 text-center">
          <p className="text-muted-foreground text-sm">No markets moved more than 5% in the last 24 hours.</p>
          <p className="text-muted-foreground text-xs mt-1">Markets may be in a low-volatility period.</p>
        </div>
      )}

      {/* Mover rows */}
      {movers.map((mover, idx) => (
        <div
          key={mover.marketId}
          className={cn(
            'border border-t-0 border-border bg-black hover:bg-terminal-green/5 transition-colors',
            idx === 0 && 'border-t border-border'
          )}
        >
          {/* Main row */}
          <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-4 px-4 py-3 items-center">
            <Link href={`/market/${mover.marketId}`} className="min-w-0">
              <p className="text-sm text-terminal-green glow-text-subtle hover:glow-text transition-all line-clamp-1 font-medium">
                {mover.question}
              </p>
            </Link>
            <span className="text-sm font-mono text-right text-foreground">
              {formatPrice(mover.currentPrice)}
            </span>
            <span className={cn(
              'text-sm font-mono font-bold text-right flex items-center justify-end gap-1',
              mover.direction === 'up' ? 'text-terminal-green' : 'text-terminal-red'
            )}>
              {mover.direction === 'up'
                ? <ArrowUp className="w-3 h-3" />
                : <ArrowDown className="w-3 h-3" />}
              {formatChange(mover.change24h)}
            </span>
            <span className="text-sm font-mono text-right text-muted-foreground">
              {formatVolume(mover.volume24h)}
            </span>
            <span className="text-sm font-mono text-right text-muted-foreground">
              {formatVolume(mover.liquidity)}
            </span>
          </div>

          {/* Why row */}
          {mover.why && (
            <div className="px-4 pb-2">
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-terminal-amber uppercase tracking-wider mt-0.5 flex-shrink-0">
                  WHY
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {mover.why}
                </p>
              </div>
            </div>
          )}

          {/* Headlines */}
          {mover.headlines.length > 0 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {mover.headlines.map((h, hi) => (
                <a
                  key={hi}
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-terminal-green transition-colors border border-border px-2 py-1 bg-black hover:border-terminal-green/50 max-w-xs"
                >
                  <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                  <span className="line-clamp-1">{h.title}</span>
                  <span className="text-terminal-amber flex-shrink-0">— {h.source}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Footer note */}
      {!loading && movers.length > 0 && (
        <div className="mt-4 text-[10px] text-muted-foreground text-center">
          Showing markets with &gt;5% price change in last 24h · News sourced from Google News RSS · AI analysis via Gemini
        </div>
      )}
    </div>
  );
}
