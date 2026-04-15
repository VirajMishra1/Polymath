'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { usePortfolioStore } from '@/lib/portfolio-store';
import { Plus, TrendingUp, TrendingDown, DollarSign, Calculator } from 'lucide-react';

interface PositionBuilderProps {
  marketId: string;
  marketQuestion: string;
  currentPrice: number;
  outcomeYes: string;
  outcomeNo: string;
  onPositionAdded?: () => void;
}

export function PositionBuilder({
  marketId,
  marketQuestion,
  currentPrice,
  outcomeYes,
  outcomeNo,
  onPositionAdded
}: PositionBuilderProps) {
  const [side, setSide] = useState<'YES' | 'NO'>('YES');
  const [quantity, setQuantity] = useState<number>(100);
  const [avgPrice, setAvgPrice] = useState<number>(currentPrice * 100);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const { addPosition } = usePortfolioStore();
  
  const effectivePrice = side === 'YES' ? currentPrice : (1 - currentPrice);
  const cost = quantity * (avgPrice / 100);
  const potentialProfit = quantity * (1 - avgPrice / 100);
  const potentialLoss = cost;
  const breakeven = avgPrice;
  
  const maxPayout = quantity;
  const roi = cost > 0 ? ((maxPayout - cost) / cost) * 100 : 0;
  
  const handleAddPosition = () => {
    addPosition({
      marketId,
      marketQuestion,
      side,
      quantity,
      avgPrice: avgPrice / 100,
      currentPrice: effectivePrice
    });
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 2000);
    onPositionAdded?.();
  };

  return (
    <div className="border border-border bg-black p-3 font-mono">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Calculator className="w-3 h-3" />
          Position Builder
        </span>
        <span className="text-[9px] text-terminal-green">Live P&L Preview</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => {
            setSide('YES');
            setAvgPrice(currentPrice * 100);
          }}
          className={cn(
            "py-2 px-3 border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2",
            side === 'YES' 
              ? "border-terminal-green bg-terminal-green/20 text-terminal-green" 
              : "border-border text-muted-foreground hover:border-terminal-green/50"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          {outcomeYes}
        </button>
        <button
          onClick={() => {
            setSide('NO');
            setAvgPrice((1 - currentPrice) * 100);
          }}
          className={cn(
            "py-2 px-3 border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2",
            side === 'NO' 
              ? "border-terminal-red bg-terminal-red/20 text-terminal-red" 
              : "border-border text-muted-foreground hover:border-terminal-red/50"
          )}
        >
          <TrendingDown className="w-4 h-4" />
          {outcomeNo}
        </button>
      </div>
      
      <div className="space-y-3 mb-4">
        <div>
          <label className="text-[9px] text-muted-foreground uppercase font-mono block mb-1">
            Shares (Quantity)
          </label>
          <div className="flex gap-1">
            {[50, 100, 250, 500, 1000].map(q => (
              <button
                key={q}
                onClick={() => setQuantity(q)}
                className={cn(
                  "flex-1 py-1 text-[10px] border transition-colors",
                  quantity === q 
                    ? "border-terminal-green text-terminal-green bg-terminal-green/10" 
                    : "border-border text-muted-foreground hover:border-terminal-green/50"
                )}
              >
                {q}
              </button>
            ))}
          </div>
          <input 
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 0)}
            className="w-full mt-1 bg-black border border-border px-2 py-1.5 text-terminal-green text-sm focus:border-terminal-green outline-none"
            placeholder="Custom amount"
          />
        </div>
        
        <div>
          <label className="text-[9px] text-muted-foreground uppercase font-mono block mb-1">
            Entry Price (¢)
          </label>
          <div className="relative">
            <input 
              type="number"
              value={avgPrice.toFixed(1)}
              onChange={(e) => setAvgPrice(Number(e.target.value) || 0)}
              step="0.5"
              min="0.5"
              max="99.5"
              className="w-full bg-black border border-border px-2 py-1.5 text-terminal-green text-sm focus:border-terminal-green outline-none pr-16"
            />
            <button
              onClick={() => setAvgPrice(effectivePrice * 100)}
              className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[9px] border border-terminal-green/50 text-terminal-green hover:bg-terminal-green/10 transition-colors"
            >
              MARKET
            </button>
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
            <span>Market: {(effectivePrice * 100).toFixed(1)}¢</span>
            <span>Implied: {avgPrice.toFixed(1)}%</span>
          </div>
        </div>
      </div>
      
      <div className="border border-border p-2 bg-black/50 mb-3">
        <div className="text-[9px] text-muted-foreground uppercase mb-2">Position Summary</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cost:</span>
            <span className="text-terminal-amber">${cost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max Payout:</span>
            <span className="text-terminal-green">${maxPayout.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max Profit:</span>
            <span className="text-terminal-green">+${potentialProfit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max Loss:</span>
            <span className="text-terminal-red">-${potentialLoss.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Breakeven:</span>
            <span className="text-terminal-cyan">{breakeven.toFixed(1)}¢</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ROI if Win:</span>
            <span className="text-terminal-green">+{roi.toFixed(0)}%</span>
          </div>
        </div>
      </div>
      
      <button 
        onClick={handleAddPosition}
        disabled={quantity <= 0 || avgPrice <= 0}
        className={cn(
          "w-full py-2.5 font-bold uppercase text-xs transition-all flex items-center justify-center gap-2",
          showConfirm
            ? "bg-terminal-green text-black"
            : side === 'YES'
              ? "bg-terminal-green hover:bg-terminal-green/80 text-black disabled:bg-terminal-green/30 disabled:text-black/50"
              : "bg-terminal-red hover:bg-terminal-red/80 text-white disabled:bg-terminal-red/30 disabled:text-white/50"
        )}
      >
        {showConfirm ? (
          <>Added to Portfolio!</>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Add {side} Position
          </>
        )}
      </button>
      
      <div className="mt-2 text-center">
        <span className="text-[9px] text-muted-foreground">
          Position will be tracked in your portfolio
        </span>
      </div>
    </div>
  );
}
