'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Keyboard, Briefcase, Zap, GitMerge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTerminalStore } from '@/lib/store';
import { usePortfolioStore } from '@/lib/portfolio-store';
import { MarketTicker } from './market-ticker';

interface HeaderStats {
  marketCount: number;
  totalVolume24h: number;
  totalLiquidity: number;
}

function formatVolume(vol: number) {
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
  return `$${vol.toFixed(0)}`;
}

export function TerminalHeader() {
  const { keyboardShortcutsEnabled, toggleKeyboardShortcuts } = useTerminalStore();
  const { positions } = usePortfolioStore();
  const [stats, setStats] = useState<HeaderStats | null>(null);

  useEffect(() => {
    fetch('/api/events?limit=50')
      .then(r => r.json())
      .then(data => {
        const events: { markets_count: number; volume: number; liquidity: number }[] = data.events ?? [];
        setStats({
          marketCount: events.reduce((sum, e) => sum + (e.markets_count ?? 0), 0),
          totalVolume24h: events.reduce((sum, e) => sum + (e.volume ?? 0), 0),
          totalLiquidity: events.reduce((sum, e) => sum + (e.liquidity ?? 0), 0),
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="sticky top-0 z-50">
      <header className="h-10 border-b border-border bg-black flex items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-mono font-bold text-sm tracking-tight text-terminal-green glow-text">
              Polymath
            </span>
            <span className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
              PREDICTION MARKETS
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <Link
            href="/movers"
            className="flex items-center gap-2 px-3 py-1 border border-border text-muted-foreground hover:text-terminal-amber hover:border-terminal-amber/50 transition-all"
          >
            <Zap className="w-3 h-3" />
            <span>Movers</span>
          </Link>
          <Link
            href="/correlation"
            className="flex items-center gap-2 px-3 py-1 border border-border text-muted-foreground hover:text-cyan-400 hover:border-cyan-400/50 transition-all"
          >
            <GitMerge className="w-3 h-3" />
            <span>Correlation</span>
          </Link>
          <Link
            href="/portfolio"
            className={cn(
              "flex items-center gap-2 px-3 py-1 border transition-all",
              positions.length > 0
                ? "border-terminal-green text-terminal-green hover:bg-terminal-green/10"
                : "border-border text-muted-foreground hover:text-foreground hover:border-terminal-green/50"
            )}
          >
            <Briefcase className="w-3 h-3" />
            <span>Portfolio</span>
            {positions.length > 0 && (
              <span className="px-1.5 py-0.5 bg-terminal-green/20 text-terminal-green text-[10px]">
                {positions.length}
              </span>
            )}
          </Link>
          <button
            onClick={toggleKeyboardShortcuts}
            className={cn(
              "p-1 transition-colors",
              keyboardShortcutsEnabled
                ? "text-terminal-green"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={keyboardShortcutsEnabled ? "Disable keyboard shortcuts" : "Enable keyboard shortcuts"}
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="h-8 border-b border-border bg-black flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-0.5 border border-border text-muted-foreground uppercase tracking-wider">
            System Status
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
          {stats ? (
            <>
              <span>Mkts: <span className="text-terminal-green glow-text-subtle">{stats.marketCount.toLocaleString()}</span></span>
              <span>Total Vol: <span className="text-terminal-green glow-text-subtle">{formatVolume(stats.totalVolume24h)}</span></span>
              <span>Liquidity: <span className="text-terminal-green glow-text-subtle">{formatVolume(stats.totalLiquidity)}</span></span>
            </>
          ) : (
            <span className="text-terminal-green/50 animate-pulse">Loading...</span>
          )}
        </div>
      </div>

      <MarketTicker />
    </div>
  );
}
