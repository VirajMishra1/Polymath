'use client';

import Link from 'next/link';
import { Keyboard, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTerminalStore } from '@/lib/store';
import { usePortfolioStore } from '@/lib/portfolio-store';
import { MarketTicker } from './market-ticker';

export function TerminalHeader() {
  const { keyboardShortcutsEnabled, toggleKeyboardShortcuts } = useTerminalStore();
  const { positions } = usePortfolioStore();

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
          <span>Mkts: <span className="text-terminal-green glow-text-subtle">156</span></span>
          <span>24h Vol: <span className="text-terminal-green glow-text-subtle">$4,241,884</span></span>
          <span>Avg Spread: <span className="text-terminal-green glow-text-subtle">0.059</span></span>
          <span>Health: <span className="text-terminal-green glow-text-subtle">72</span></span>
        </div>
      </div>

      <MarketTicker />
    </div>
  );
}
