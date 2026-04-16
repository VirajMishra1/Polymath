'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Orderbook as OrderbookType } from '@/lib/types';

interface SlippageCalculatorProps {
  data: OrderbookType | null;
  className?: string;
}

type Side = 'BUY' | 'SELL';

interface FillResult {
  shares: number;
  spent: number;
  avgPrice: number;
  bestPrice: number;
  slippageBps: number;
  filledLevels: number;
  exhausted: boolean; // true if book ran out before order filled
}

// Walks the book to fill `dollars` worth at the given side.
// BUY consumes asks from low to high; SELL consumes bids from high to low.
function computeFill(dollars: number, levels: { price: number; size: number }[]): FillResult | null {
  if (!levels.length || !Number.isFinite(dollars) || dollars <= 0) return null;

  const bestPrice = levels[0].price;
  let remainingDollars = dollars;
  let shares = 0;
  let spent = 0;
  let filledLevels = 0;

  for (const level of levels) {
    if (remainingDollars <= 0) break;
    const levelCost = level.price * level.size;
    if (levelCost <= remainingDollars) {
      shares += level.size;
      spent += levelCost;
      remainingDollars -= levelCost;
      filledLevels++;
    } else {
      const partialShares = remainingDollars / level.price;
      shares += partialShares;
      spent += remainingDollars;
      remainingDollars = 0;
      filledLevels++;
      break;
    }
  }

  if (shares === 0) return null;
  const avgPrice = spent / shares;
  const slippageBps = ((avgPrice - bestPrice) / bestPrice) * 10000;

  return {
    shares,
    spent,
    avgPrice,
    bestPrice,
    slippageBps: Math.abs(slippageBps),
    filledLevels,
    exhausted: remainingDollars > 0.01,
  };
}

export function SlippageCalculator({ data, className }: SlippageCalculatorProps) {
  const [amount, setAmount] = useState<string>('1000');
  const [side, setSide] = useState<Side>('BUY');

  const result = useMemo(() => {
    if (!data) return null;
    const dollars = parseFloat(amount);
    if (!Number.isFinite(dollars) || dollars <= 0) return null;
    const levels = side === 'BUY' ? data.asks : data.bids;
    return computeFill(dollars, levels.map(l => ({ price: l.price, size: l.size })));
  }, [data, amount, side]);

  const slippageColor = result
    ? result.slippageBps < 50
      ? 'text-terminal-green'
      : result.slippageBps < 200
      ? 'text-terminal-amber'
      : 'text-terminal-red'
    : 'text-muted-foreground';

  return (
    <div className={cn('w-full font-mono', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Slippage Calculator</span>
        <div className="flex border border-border">
          {(['BUY', 'SELL'] as Side[]).map(s => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={cn(
                'px-2 py-0.5 text-[9px] font-mono uppercase transition-all',
                side === s
                  ? s === 'BUY'
                    ? 'bg-terminal-green/20 text-terminal-green'
                    : 'bg-terminal-red/20 text-terminal-red'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {s} YES
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-muted-foreground">$</span>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          min="0"
          step="100"
          className="flex-1 bg-black border border-border text-xs text-terminal-green font-mono px-2 py-1 focus:outline-none focus:border-cyan-500/50"
          placeholder="Order size"
        />
      </div>

      {!data && (
        <div className="text-[10px] text-muted-foreground text-center py-2">
          Orderbook not available
        </div>
      )}

      {data && !result && (
        <div className="text-[10px] text-muted-foreground text-center py-2">
          Enter an amount to calculate slippage
        </div>
      )}

      {result && (
        <div className="border border-border bg-black p-2 space-y-1">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Best</span>
              <span className="text-foreground">{(result.bestPrice * 100).toFixed(2)}¢</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Fill</span>
              <span className="text-foreground">{(result.avgPrice * 100).toFixed(2)}¢</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shares</span>
              <span className="text-foreground">{result.shares.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Spent</span>
              <span className="text-foreground">${result.spent.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Levels</span>
              <span className="text-foreground">{result.filledLevels}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slippage</span>
              <span className={cn('font-bold', slippageColor)}>
                {result.slippageBps.toFixed(0)}bps
              </span>
            </div>
          </div>
          {result.exhausted && (
            <div className="text-[9px] text-terminal-red mt-1 pt-1 border-t border-border">
              ⚠ Book exhausted — order larger than available liquidity
            </div>
          )}
          {!result.exhausted && result.slippageBps >= 200 && (
            <div className="text-[9px] text-terminal-amber mt-1 pt-1 border-t border-border">
              ⚠ High slippage — consider breaking order into smaller chunks
            </div>
          )}
        </div>
      )}
    </div>
  );
}
