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
  Zap,
  ChevronRight,
  Plus
} from 'lucide-react';

function formatVolume(vol: number) {
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
  if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`;
  return `$${vol.toFixed(2)}`;
}

export default function PortfolioPage() {
  const { positions, removePosition, clearPositions, getPositionPnL, getTotalPnL, externalHedges } = usePortfolioStore();
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      return { var95: 0, maxDrawdown: 0, sharpe: 0, winRate: 0 };
    }
    
    const profitableCount = positions.filter(p => {
      const { pnl } = getPositionPnL(p);
      return pnl > 0;
    }).length;
    
    const var95 = totalCost * 0.15;
    const maxDrawdown = totalCost * 0.25;
    const sharpe = totalPnl > 0 ? (totalPnl / totalCost) * 2.5 : -0.5;
    const winRate = positions.length > 0 ? (profitableCount / positions.length) * 100 : 0;
    
    return { var95, maxDrawdown, sharpe, winRate };
  }, [mounted, positions, totalCost, totalPnl, getPositionPnL]);

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
          <button
            onClick={clearPositions}
            className="text-xs px-3 py-1 border border-terminal-red text-terminal-red hover:bg-terminal-red/10 transition-colors"
          >
            Clear All
          </button>
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
          <div className="text-[9px] text-muted-foreground uppercase mb-1">Sharpe Ratio</div>
          <div className={cn(
            "text-xl font-bold",
            riskMetrics.sharpe > 1 ? "text-terminal-green" : 
            riskMetrics.sharpe > 0 ? "text-terminal-amber" : "text-terminal-red"
          )}>
            {riskMetrics.sharpe.toFixed(2)}
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
              currentPrice={0.5}
              showTimeline
              daysToExpiry={30}
            />

            <TimeDecayVisualizer
              positions={aggregatePositions}
              currentPrice={0.5}
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

            <div className="border border-terminal-amber bg-terminal-amber/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-terminal-amber" />
                <span className="text-[10px] text-terminal-amber font-bold uppercase">Quick Actions</span>
              </div>
              <div className="space-y-2">
                <button 
                  className="w-full py-2 text-xs border border-terminal-green text-terminal-green hover:bg-terminal-green/10 transition-colors"
                  disabled={selectedPositions.length === 0}
                >
                  Close Selected ({selectedPositions.length})
                </button>
                <button className="w-full py-2 text-xs border border-terminal-amber text-terminal-amber hover:bg-terminal-amber/10 transition-colors">
                  Hedge All Positions
                </button>
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
