'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { usePortfolioStore, type ExternalHedge } from '@/lib/portfolio-store';
import { Shield, Plus, X, TrendingUp, TrendingDown, RefreshCw, AlertTriangle } from 'lucide-react';

const CRYPTO_PRICES: Record<string, number> = {
  ETH: 3200,
  BTC: 95000,
  SOL: 180
};

interface ExternalHedgePanelProps {
  marketQuestion: string;
  positions: {
    side: 'YES' | 'NO';
    quantity: number;
    avgPrice: number;
  }[];
  className?: string;
}

export function ExternalHedgePanel({
  marketQuestion,
  positions,
  className
}: ExternalHedgePanelProps) {
  const { externalHedges, addExternalHedge, removeExternalHedge } = usePortfolioStore();
  const [showAddHedge, setShowAddHedge] = useState(false);
  const [newHedge, setNewHedge] = useState<{
    asset: 'ETH' | 'BTC' | 'SOL';
    side: 'LONG' | 'SHORT';
    size: number;
    leverage: number;
  }>({
    asset: 'ETH',
    side: 'SHORT',
    size: 0.1,
    leverage: 1
  });

  const correlations = useMemo(() => {
    const isCryptoRelated = /bitcoin|btc|ethereum|eth|solana|sol|crypto/i.test(marketQuestion);
    const isBullish = /pump|moon|ath|bull|up/i.test(marketQuestion);
    const isBearish = /crash|dump|bear|down|ban/i.test(marketQuestion);
    
    return {
      ETH: isCryptoRelated ? (isBullish ? 0.8 : isBearish ? -0.7 : 0.5) : 0.3,
      BTC: isCryptoRelated ? (isBullish ? 0.85 : isBearish ? -0.75 : 0.6) : 0.35,
      SOL: isCryptoRelated ? (isBullish ? 0.75 : isBearish ? -0.65 : 0.4) : 0.25
    };
  }, [marketQuestion]);

  const totalExposure = useMemo(() => {
    return positions.reduce((acc, pos) => {
      return acc + (pos.quantity * pos.avgPrice);
    }, 0);
  }, [positions]);

  const hedgeRecommendations = useMemo(() => {
    if (positions.length === 0) return [];
    
    const netDelta = positions.reduce((acc, pos) => {
      if (pos.side === 'YES') return acc + pos.quantity;
      return acc - pos.quantity;
    }, 0);
    
    const recommendations: {
      asset: 'ETH' | 'BTC' | 'SOL';
      action: 'LONG' | 'SHORT';
      size: number;
      reason: string;
      riskReduction: number;
    }[] = [];
    
    if (Math.abs(netDelta) > 50) {
      const bestAsset = Object.entries(correlations)
        .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))[0][0] as 'ETH' | 'BTC' | 'SOL';
      
      const correlation = correlations[bestAsset];
      const action = (netDelta > 0 && correlation > 0) || (netDelta < 0 && correlation < 0) ? 'SHORT' : 'LONG';
      const hedgeNotional = Math.abs(netDelta) * 0.5;
      const size = hedgeNotional / CRYPTO_PRICES[bestAsset];
      
      recommendations.push({
        asset: bestAsset,
        action,
        size: Math.round(size * 1000) / 1000,
        reason: `Hedge ${Math.abs(correlation * 100).toFixed(0)}% correlated exposure`,
        riskReduction: Math.abs(correlation) * 40
      });
    }
    
    return recommendations;
  }, [positions, correlations]);

  const hedgePnL = useMemo(() => {
    return externalHedges.reduce((acc, hedge) => {
      const currentPrice = CRYPTO_PRICES[hedge.asset] * (1 + (Math.random() - 0.5) * 0.02);
      const priceDiff = currentPrice - hedge.entryPrice;
      const pnl = hedge.side === 'LONG' 
        ? hedge.size * priceDiff * hedge.leverage
        : -hedge.size * priceDiff * hedge.leverage;
      return acc + pnl;
    }, 0);
  }, [externalHedges]);

  const handleAddHedge = () => {
    addExternalHedge({
      asset: newHedge.asset,
      side: newHedge.side,
      size: newHedge.size,
      entryPrice: CRYPTO_PRICES[newHedge.asset],
      currentPrice: CRYPTO_PRICES[newHedge.asset],
      leverage: newHedge.leverage
    });
    setShowAddHedge(false);
  };

  return (
    <div className={cn("border border-border bg-black p-3 font-mono", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-3 h-3" />
          External Hedge Integration
        </span>
        <button
          onClick={() => setShowAddHedge(!showAddHedge)}
          className="text-[9px] px-2 py-1 border border-terminal-green text-terminal-green hover:bg-terminal-green/10 transition-colors flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Add Hedge
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {(['ETH', 'BTC', 'SOL'] as const).map(asset => (
          <div key={asset} className="border border-border p-2 bg-black/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-terminal-amber">{asset}</span>
              <span className="text-[9px] text-muted-foreground">
                ${CRYPTO_PRICES[asset].toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-muted-foreground">Correlation:</span>
              <span className={cn(
                "text-[10px] font-bold",
                correlations[asset] > 0.5 ? "text-terminal-green" :
                correlations[asset] < -0.5 ? "text-terminal-red" :
                "text-terminal-amber"
              )}>
                {correlations[asset] > 0 ? '+' : ''}{(correlations[asset] * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {hedgeRecommendations.length > 0 && (
        <div className="mb-3 p-2 border border-terminal-amber bg-terminal-amber/10">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3 h-3 text-terminal-amber" />
            <span className="text-[10px] text-terminal-amber font-bold uppercase">Recommended Hedge</span>
          </div>
          {hedgeRecommendations.map((rec, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div>
                <span className={cn(
                  "font-bold",
                  rec.action === 'LONG' ? "text-terminal-green" : "text-terminal-red"
                )}>
                  {rec.action}
                </span>
                {' '}
                <span className="text-terminal-amber">{rec.size} {rec.asset}</span>
              </div>
              <div className="text-muted-foreground text-[10px]">
                -{rec.riskReduction.toFixed(0)}% risk
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddHedge && (
        <div className="mb-3 p-3 border border-terminal-green bg-terminal-green/5">
          <div className="text-[10px] text-terminal-green uppercase mb-2">New External Position</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[9px] text-muted-foreground uppercase block mb-1">Asset</label>
              <select
                value={newHedge.asset}
                onChange={(e) => setNewHedge({ ...newHedge, asset: e.target.value as 'ETH' | 'BTC' | 'SOL' })}
                className="w-full bg-black border border-border px-2 py-1 text-terminal-green text-sm focus:border-terminal-green outline-none"
              >
                <option value="ETH">ETH</option>
                <option value="BTC">BTC</option>
                <option value="SOL">SOL</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground uppercase block mb-1">Side</label>
              <div className="flex gap-1">
                <button
                  onClick={() => setNewHedge({ ...newHedge, side: 'LONG' })}
                  className={cn(
                    "flex-1 py-1 text-[10px] border transition-colors",
                    newHedge.side === 'LONG' 
                      ? "border-terminal-green bg-terminal-green/20 text-terminal-green" 
                      : "border-border text-muted-foreground"
                  )}
                >
                  LONG
                </button>
                <button
                  onClick={() => setNewHedge({ ...newHedge, side: 'SHORT' })}
                  className={cn(
                    "flex-1 py-1 text-[10px] border transition-colors",
                    newHedge.side === 'SHORT' 
                      ? "border-terminal-red bg-terminal-red/20 text-terminal-red" 
                      : "border-border text-muted-foreground"
                  )}
                >
                  SHORT
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[9px] text-muted-foreground uppercase block mb-1">Size ({newHedge.asset})</label>
              <input
                type="number"
                value={newHedge.size}
                onChange={(e) => setNewHedge({ ...newHedge, size: Number(e.target.value) || 0 })}
                step="0.01"
                className="w-full bg-black border border-border px-2 py-1 text-terminal-green text-sm focus:border-terminal-green outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground uppercase block mb-1">Leverage</label>
              <select
                value={newHedge.leverage}
                onChange={(e) => setNewHedge({ ...newHedge, leverage: Number(e.target.value) })}
                className="w-full bg-black border border-border px-2 py-1 text-terminal-green text-sm focus:border-terminal-green outline-none"
              >
                {[1, 2, 3, 5, 10].map(l => (
                  <option key={l} value={l}>{l}x</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">
              Notional: ${(newHedge.size * CRYPTO_PRICES[newHedge.asset] * newHedge.leverage).toFixed(2)}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddHedge(false)}
                className="px-3 py-1 text-[10px] border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddHedge}
                className="px-3 py-1 text-[10px] bg-terminal-green text-black font-bold hover:bg-terminal-green/80 transition-colors"
              >
                Add Position
              </button>
            </div>
          </div>
        </div>
      )}

      {externalHedges.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="text-[9px] text-muted-foreground uppercase">Active External Positions</div>
          {externalHedges.map(hedge => {
            const currentPrice = CRYPTO_PRICES[hedge.asset];
            const pnl = hedge.side === 'LONG'
              ? hedge.size * (currentPrice - hedge.entryPrice) * hedge.leverage
              : -hedge.size * (currentPrice - hedge.entryPrice) * hedge.leverage;
            
            return (
              <div key={hedge.id} className="flex items-center justify-between p-2 border border-border bg-black/50">
                <div className="flex items-center gap-2">
                  {hedge.side === 'LONG' ? (
                    <TrendingUp className="w-3 h-3 text-terminal-green" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-terminal-red" />
                  )}
                  <span className="text-xs">
                    <span className={hedge.side === 'LONG' ? "text-terminal-green" : "text-terminal-red"}>
                      {hedge.side}
                    </span>
                    {' '}
                    <span className="text-terminal-amber">{hedge.size} {hedge.asset}</span>
                    {hedge.leverage > 1 && (
                      <span className="text-muted-foreground"> @ {hedge.leverage}x</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-xs font-bold",
                    pnl >= 0 ? "text-terminal-green" : "text-terminal-red"
                  )}>
                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeExternalHedge(hedge.id)}
                    className="text-muted-foreground hover:text-terminal-red transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="border border-border p-2 bg-black/50">
          <div className="text-[9px] text-muted-foreground uppercase">Market Exposure</div>
          <div className="text-terminal-amber font-bold">${totalExposure.toFixed(2)}</div>
        </div>
        <div className="border border-border p-2 bg-black/50">
          <div className="text-[9px] text-muted-foreground uppercase">Hedge Value</div>
          <div className="text-terminal-cyan font-bold">
            ${externalHedges.reduce((acc, h) => acc + h.size * CRYPTO_PRICES[h.asset], 0).toFixed(2)}
          </div>
        </div>
        <div className="border border-border p-2 bg-black/50">
          <div className="text-[9px] text-muted-foreground uppercase">Hedge P&L</div>
          <div className={cn("font-bold", hedgePnL >= 0 ? "text-terminal-green" : "text-terminal-red")}>
            {hedgePnL >= 0 ? '+' : ''}${hedgePnL.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
