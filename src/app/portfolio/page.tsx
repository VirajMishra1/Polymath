'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePortfolioStore, type Position } from '@/lib/portfolio-store';
import { PayoffCurve } from '@/components/charts/payoff-curve';
import { TimeDecayVisualizer } from '@/components/time-decay-visualizer';
import { ExternalHedgePanel } from '@/components/external-hedge-panel';
import { cn } from '@/lib/utils';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  X,
  AlertTriangle,
  PieChart,
  BarChart3,
  Target,
  ChevronRight,
  Plus,
  RefreshCw,
} from 'lucide-react';

function formatVolume(vol: number) {
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
  if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`;
  return `$${vol.toFixed(2)}`;
}

export default function PortfolioPage() {
  const { positions, removePosition, clearPositions, getPositionPnL, getTotalPnL, updatePosition } = usePortfolioStore();
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const refreshPrices = useMemo(() => async () => {
    const uniqueMarketIds = Array.from(new Set(positions.map(p => p.marketId)));
    if (uniqueMarketIds.length === 0) return;
    setRefreshing(true);
    try {
      const results = await Promise.all(
        uniqueMarketIds.map(async (id) => {
          try {
            const res = await fetch(`/api/markets/${id}`);
            if (!res.ok) return null;
            const data = await res.json();
            const yesPrice = data?.market?.price_yes;
            if (typeof yesPrice !== 'number' || !Number.isFinite(yesPrice)) return null;
            return { id, yesPrice };
          } catch {
            return null;
          }
        })
      );
      const priceMap = new Map<string, number>();
      for (const r of results) if (r) priceMap.set(r.id, r.yesPrice);
      positions.forEach(p => {
        const yes = priceMap.get(p.marketId);
        if (yes === undefined) return;
        const sideShare = p.side === 'YES' ? yes : 1 - yes;
        if (Math.abs(sideShare - p.currentPrice) > 1e-6) {
          updatePosition(p.id, { currentPrice: sideShare });
        }
      });
      setLastRefresh(Date.now());
    } finally {
      setRefreshing(false);
    }
  }, [positions, updatePosition]);

  useEffect(() => {
    if (!mounted) return;
    refreshPrices();
    // intentionally only on mount — manual refresh button thereafter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const { totalPnl, totalValue, totalCost } = useMemo(() => {
    if (!mounted) return { totalPnl: 0, totalValue: 0, totalCost: 0 };
    return getTotalPnL();
  }, [mounted, getTotalPnL, positions]);

  const aggregatePositions = useMemo(() => {
    if (!mounted) return [];
    return positions.map(p => ({
      side: p.side,
      quantity: p.quantity,
      avgPrice: p.avgPrice
    }));
  }, [mounted, positions]);

  const marketGroups = useMemo(() => {
    if (!mounted) return {};
    const groups: Record<string, Position[]> = {};
    positions.forEach(p => {
      if (!groups[p.marketId]) groups[p.marketId] = [];
      groups[p.marketId].push(p);
    });
    return groups;
  }, [mounted, positions]);

  const riskMetrics = useMemo(() => {
    if (!mounted || positions.length === 0) {
      return { var95: 0, winRate: 0, netExposure: 0, avgImpliedProb: 0 };
    }

    const profitableCount = positions.filter(p => getPositionPnL(p).pnl > 0).length;

    // Parametric VaR assuming independent binary outcomes:
    // each position contributes variance q^2 * p * (1-p) where p = currentPrice of the held side.
    // This is an approximation (markets aren't independent, prices aren't stationary) but it's a
    // real calculation from live data, not a fudge factor.
    const variance = positions.reduce((acc, p) => {
      const prob = Math.max(0, Math.min(1, p.currentPrice));
      return acc + p.quantity * p.quantity * prob * (1 - prob);
    }, 0);
    const var95 = 1.645 * Math.sqrt(variance);

    const netExposure = positions.reduce(
      (acc, p) => acc + p.quantity * p.currentPrice * (p.side === 'YES' ? 1 : -1),
      0
    );

    const avgImpliedProb = positions.length > 0
      ? positions.reduce((acc, p) => acc + p.currentPrice, 0) / positions.length
      : 0;

    const winRate = (profitableCount / positions.length) * 100;

    return { var95, winRate, netExposure, avgImpliedProb };
  }, [mounted, positions, getPositionPnL]);

  // Weighted-avg current price for the payoff/time-decay visualizers.
  const weightedCurrentPrice = useMemo(() => {
    if (positions.length === 0) return 0.5;
    const totalQty = positions.reduce((a, p) => a + p.quantity, 0);
    if (totalQty === 0) return 0.5;
    return positions.reduce((a, p) => a + p.currentPrice * p.quantity, 0) / totalQty;
  }, [positions]);

  const togglePositionSelection = (id: string) => {
    setSelectedPositions(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  if (!mounted) {
    return (
      <div className="p-4 max-w-7xl mx-auto font-mono">
        <div className="flex items-center justify-center py-20">
          <span className="text-terminal-green glow-text animate-pulse">Loading portfolio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto font-mono">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-terminal-green" />
          <h1 className="text-xl font-bold text-terminal-green glow-text">Portfolio Dashboard</h1>
          <span className="text-xs text-muted-foreground px-2 py-0.5 border border-border">
            {positions.length} positions
          </span>
        </div>
        {positions.length > 0 && (
          <div className="flex items-center gap-2">
            {lastRefresh && (
              <span className="text-[9px] text-muted-foreground">
                Prices @ {new Date(lastRefresh).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={refreshPrices}
              disabled={refreshing}
              className="text-xs px-3 py-1 border border-terminal-green text-terminal-green hover:bg-terminal-green/10 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </button>
            <button
              onClick={clearPositions}
              className="text-xs px-3 py-1 border border-terminal-red text-terminal-red hover:bg-terminal-red/10 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-6 gap-3 mb-4">
        <div className="border border-border p-3 bg-black">
          <div className="text-[9px] text-muted-foreground uppercase mb-1">Total Value</div>
          <div className="text-xl font-bold text-terminal-green glow-text">
            {formatVolume(totalValue)}
          </div>
        </div>
        <div className="border border-border p-3 bg-black">
          <div className="text-[9px] text-muted-foreground uppercase mb-1">Total Cost</div>
          <div className="text-xl font-bold text-terminal-amber">
            {formatVolume(totalCost)}
          </div>
        </div>
        <div className="border border-border p-3 bg-black">
          <div className="text-[9px] text-muted-foreground uppercase mb-1">Unrealized P&L</div>
          <div className={cn(
            "text-xl font-bold",
            totalPnl >= 0 ? "text-terminal-green glow-text" : "text-terminal-red"
          )}>
            {totalPnl >= 0 ? '+' : ''}{formatVolume(totalPnl)}
          </div>
        </div>
        <div className="border border-border p-3 bg-black">
          <div className="text-[9px] text-muted-foreground uppercase mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-terminal-amber" />
            VaR (95%)
          </div>
          <div className="text-xl font-bold text-terminal-red">
            -{formatVolume(riskMetrics.var95)}
          </div>
        </div>
        <div className="border border-border p-3 bg-black">
          <div className="text-[9px] text-muted-foreground uppercase mb-1">Win Rate</div>
          <div className={cn(
            "text-xl font-bold",
            riskMetrics.winRate >= 50 ? "text-terminal-green" : "text-terminal-amber"
          )}>
            {riskMetrics.winRate.toFixed(0)}%
          </div>
        </div>
        <div className="border border-border p-3 bg-black">
          <div className="text-[9px] text-muted-foreground uppercase mb-1">Net Exposure</div>
          <div className={cn(
            "text-xl font-bold",
            riskMetrics.netExposure >= 0 ? "text-terminal-green" : "text-terminal-red"
          )}>
            {riskMetrics.netExposure >= 0 ? '+' : ''}{formatVolume(riskMetrics.netExposure)}
          </div>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="border border-border p-12 text-center bg-black">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-bold text-terminal-green mb-2">No Positions Yet</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Start building your portfolio by adding positions from market pages.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-terminal-green text-black font-bold text-sm hover:bg-terminal-green/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Browse Markets
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 space-y-4">
            <PayoffCurve
              positions={aggregatePositions}
              currentPrice={weightedCurrentPrice}
              showTimeline
              daysToExpiry={30}
            />

            <TimeDecayVisualizer
              positions={aggregatePositions}
              currentPrice={weightedCurrentPrice}
              daysToExpiry={30}
            />

            <div className="border border-border bg-black p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-3 h-3" />
                  Positions by Market
                </span>
                <span className="text-[9px] text-terminal-green">
                  {Object.keys(marketGroups).length} markets
                </span>
              </div>

              <div className="space-y-3">
                {Object.entries(marketGroups).map(([marketId, marketPositions]) => {
                  const marketPnL = marketPositions.reduce((acc, p) => {
                    const { pnl } = getPositionPnL(p);
                    return acc + pnl;
                  }, 0);
                  
                  const marketCost = marketPositions.reduce((acc, p) => acc + p.quantity * p.avgPrice, 0);
                  
                  return (
                    <div key={marketId} className="border border-border p-3 bg-black/50">
                      <div className="flex items-start justify-between mb-2">
                        <Link 
                          href={`/market/${marketId}`}
                          className="flex-1 text-sm text-terminal-green hover:glow-text transition-all line-clamp-1 flex items-center gap-1"
                        >
                          {marketPositions[0]?.marketQuestion || 'Unknown Market'}
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                        <div className={cn(
                          "text-sm font-bold",
                          marketPnL >= 0 ? "text-terminal-green" : "text-terminal-red"
                        )}>
                          {marketPnL >= 0 ? '+' : ''}${marketPnL.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        {marketPositions.map(pos => {
                          const { pnl, pnlPercent } = getPositionPnL(pos);
                          return (
                            <div 
                              key={pos.id} 
                              className={cn(
                                "flex items-center justify-between p-2 border transition-colors",
                                selectedPositions.includes(pos.id) 
                                  ? "border-terminal-green bg-terminal-green/10" 
                                  : "border-border/50 hover:border-border"
                              )}
                              onClick={() => togglePositionSelection(pos.id)}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedPositions.includes(pos.id)}
                                  onChange={() => {}}
                                  className="accent-terminal-green"
                                />
                                {pos.side === 'YES' ? (
                                  <TrendingUp className="w-3 h-3 text-terminal-green" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 text-terminal-red" />
                                )}
                                <span className="text-xs">
                                  <span className={pos.side === 'YES' ? "text-terminal-green" : "text-terminal-red"}>
                                    {pos.side}
                                  </span>
                                  {' '}
                                  <span className="text-muted-foreground">
                                    {pos.quantity} @ {(pos.avgPrice * 100).toFixed(1)}¢
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={cn(
                                  "text-xs font-bold",
                                  pnl >= 0 ? "text-terminal-green" : "text-terminal-red"
                                )}>
                                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                                  <span className="text-muted-foreground ml-1">
                                    ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
                                  </span>
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removePosition(pos.id);
                                  }}
                                  className="text-muted-foreground hover:text-terminal-red transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-span-4 space-y-4">
            <div className="border border-border bg-black p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <PieChart className="w-3 h-3" />
                Portfolio Allocation
              </div>
              
              <div className="space-y-2">
                {Object.entries(marketGroups).map(([marketId, marketPositions]) => {
                  const marketCost = marketPositions.reduce((acc, p) => acc + p.quantity * p.avgPrice, 0);
                  const percentage = totalCost > 0 ? (marketCost / totalCost) * 100 : 0;
                  
                  return (
                    <div key={marketId}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground truncate max-w-[150px]">
                          {marketPositions[0]?.marketQuestion?.slice(0, 30) || 'Market'}...
                        </span>
                        <span className="text-terminal-green">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-border overflow-hidden">
                        <div 
                          className="h-full bg-terminal-green"
                          style={{ width: `${percentage}%`, boxShadow: '0 0 4px #00ff41' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border border-border bg-black p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Target className="w-3 h-3" />
                Risk Analysis
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 border border-border">
                  <span className="text-muted-foreground">Net Delta</span>
                  <span className={cn(
                    "font-bold",
                    aggregatePositions.reduce((acc, p) => 
                      acc + (p.side === 'YES' ? p.quantity : -p.quantity), 0
                    ) >= 0 ? "text-terminal-green" : "text-terminal-red"
                  )}>
                    {aggregatePositions.reduce((acc, p) => 
                      acc + (p.side === 'YES' ? p.quantity : -p.quantity), 0
                    ).toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between p-2 border border-border">
                  <span className="text-muted-foreground">Max Profit</span>
                  <span className="text-terminal-green font-bold">
                    +${aggregatePositions.reduce((acc, p) => 
                      acc + p.quantity * (1 - p.avgPrice), 0
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between p-2 border border-border">
                  <span className="text-muted-foreground">Max Loss</span>
                  <span className="text-terminal-red font-bold">
                    -${totalCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between p-2 border border-border">
                  <span className="text-muted-foreground">Avg Entry</span>
                  <span className="text-terminal-amber font-bold">
                    {positions.length > 0 
                      ? (positions.reduce((acc, p) => acc + p.avgPrice, 0) / positions.length * 100).toFixed(1)
                      : 0
                    }¢
                  </span>
                </div>
              </div>
            </div>

            <ExternalHedgePanel
              marketQuestion="portfolio aggregate"
              positions={aggregatePositions}
            />

            <div className="border border-border bg-black p-3">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="w-4 h-4 text-terminal-green" />
                <span className="text-[10px] text-terminal-green font-bold uppercase">Actions</span>
              </div>
              <div className="space-y-2">
                {selectedPositions.length > 0 && (
                  <button
                    onClick={() => {
                      selectedPositions.forEach(id => removePosition(id));
                      setSelectedPositions([]);
                    }}
                    className="w-full py-2 text-xs border border-terminal-red text-terminal-red hover:bg-terminal-red/10 transition-colors"
                  >
                    Close Selected ({selectedPositions.length})
                  </button>
                )}
                <Link
                  href="/"
                  className="block w-full py-2 text-xs text-center bg-terminal-green text-black font-bold hover:bg-terminal-green/80 transition-colors"
                >
                  Add More Positions
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground font-mono">
        <span className="flex items-center gap-2">
          <kbd className="px-2 py-1 border border-border bg-black text-terminal-green">P</kbd>
          <span>Portfolio</span>
        </span>
        <span className="flex items-center gap-2">
          <kbd className="px-2 py-1 border border-border bg-black text-terminal-green">/</kbd>
          <span>Search markets</span>
        </span>
        <span className="flex items-center gap-2">
          <kbd className="px-2 py-1 border border-border bg-black text-terminal-green">Esc</kbd>
          <span>Go back</span>
        </span>
      </div>
    </div>
  );
}
