'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Orderbook as OrderbookType } from '@/lib/types';

interface OrderbookProps {
  data: OrderbookType;
  className?: string;
}

export function Orderbook({ data, className }: OrderbookProps) {
  const maxTotal = useMemo(() => {
    const maxBid = data.bids.length > 0 ? Math.max(...data.bids.map(b => b.total)) : 0;
    const maxAsk = data.asks.length > 0 ? Math.max(...data.asks.map(a => a.total)) : 0;
    return Math.max(maxBid, maxAsk);
  }, [data]);

  const formatPrice = (price: number) => `${(price * 100).toFixed(1)}¢`;
  const formatSize = (size: number) => {
    if (size >= 1000000) return `${(size / 1000000).toFixed(1)}M`;
    if (size >= 1000) return `${Math.round(size / 1000)}K`;
    return size.toString();
  };
  const formatTotal = (total: number) => `$${Math.round(total)}`;

  return (
    <div className={cn("w-full font-mono", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Order Book</span>
        <div className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-terminal-green animate-pulse" style={{ boxShadow: '0 0 2px #00ff41' }} />
          <span className="text-[9px] text-terminal-green uppercase">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-3 text-[9px] text-muted-foreground uppercase tracking-wider py-1 border-b border-border">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      <div className="max-h-[180px] overflow-y-auto scrollbar-terminal">
        {data.asks.slice(0, 5).reverse().map((ask, i) => (
            <div key={`ask-${i}`} className="relative grid grid-cols-3 text-[10px] py-1">
              <div 
                className="absolute inset-y-0 right-0 bg-terminal-red/10" 
                style={{ width: `${(ask.total / maxTotal) * 100}%` }}
              />
              <span className="relative text-terminal-green">{formatPrice(ask.price)}</span>
              <span className="relative text-right text-foreground">{formatSize(ask.size)}</span>
              <span className="relative text-right text-muted-foreground">{formatTotal(ask.total)}</span>
            </div>
        ))}

        <div className="grid grid-cols-3 text-[10px] py-1 border-y border-border my-0.5 bg-black">
          <span className="text-muted-foreground uppercase text-[9px]">Spread</span>
          <span />
          <span className="text-right text-terminal-amber">{(data.spread * 100).toFixed(2)}¢</span>
        </div>

        {data.bids.slice(0, 5).map((bid, i) => (
          <div key={`bid-${i}`} className="relative grid grid-cols-3 text-[10px] py-1">
            <div 
              className="absolute inset-y-0 right-0 bg-terminal-green/10" 
              style={{ width: `${(bid.total / maxTotal) * 100}%` }}
            />
            <span className="relative text-terminal-green">{formatPrice(bid.price)}</span>
            <span className="relative text-right text-foreground">{formatSize(bid.size)}</span>
            <span className="relative text-right text-muted-foreground">{formatTotal(bid.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
