'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PayoffCurveProps {
  positions: {
    side: 'YES' | 'NO';
    quantity: number;
    avgPrice: number;
  }[];
  currentPrice: number;
  className?: string;
  showTimeline?: boolean;
  daysToExpiry?: number;
}

export function PayoffCurve({ 
  positions, 
  currentPrice,
  className,
  showTimeline = false,
  daysToExpiry = 30
}: PayoffCurveProps) {
  const chartWidth = 500;
  const chartHeight = 250;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const { payoffData, maxProfit, maxLoss, breakevens, timeDecayData } = useMemo(() => {
    const pricePoints: number[] = [];
    for (let p = 0; p <= 100; p += 1) {
      pricePoints.push(p / 100);
    }
    
    const payoffData = pricePoints.map(price => {
      let totalPnL = 0;
      
      positions.forEach(pos => {
        const cost = pos.quantity * pos.avgPrice;
        if (pos.side === 'YES') {
          const value = pos.quantity * price;
          totalPnL += value - cost;
        } else {
          const value = pos.quantity * (1 - price);
          totalPnL += value - cost;
        }
      });
      
      return { price: price * 100, pnl: totalPnL };
    });
    
    const pnls = payoffData.map(d => d.pnl);
    const maxProfit = Math.max(...pnls);
    const maxLoss = Math.min(...pnls);
    
    const breakevens: number[] = [];
    for (let i = 1; i < payoffData.length; i++) {
      const prev = payoffData[i - 1];
      const curr = payoffData[i];
      if ((prev.pnl <= 0 && curr.pnl >= 0) || (prev.pnl >= 0 && curr.pnl <= 0)) {
        const ratio = Math.abs(prev.pnl) / (Math.abs(prev.pnl) + Math.abs(curr.pnl));
        breakevens.push(prev.price + ratio * (curr.price - prev.price));
      }
    }
    
      const timeDecayDays = [...new Set([7, 14, 21, daysToExpiry].filter(d => d <= daysToExpiry))].sort((a, b) => a - b);
      const timeDecayData = showTimeline ? timeDecayDays.map(days => {
      const timeValue = days / daysToExpiry;
      return {
        days,
        data: pricePoints.map(price => {
          let totalPnL = 0;
          positions.forEach(pos => {
            const cost = pos.quantity * pos.avgPrice;
            if (pos.side === 'YES') {
              const adjustedPrice = pos.avgPrice + (price - pos.avgPrice) * timeValue;
              const value = pos.quantity * adjustedPrice;
              totalPnL += value - cost;
            } else {
              const adjustedPrice = (1 - pos.avgPrice) + ((1 - price) - (1 - pos.avgPrice)) * timeValue;
              const value = pos.quantity * adjustedPrice;
              totalPnL += value - cost;
            }
          });
          return { price: price * 100, pnl: totalPnL };
        })
      };
    }) : [];
    
    return { payoffData, maxProfit, maxLoss, breakevens, timeDecayData };
  }, [positions, showTimeline, daysToExpiry]);

  if (positions.length === 0) {
    return (
      <div className={cn("border border-border bg-black p-4 font-mono", className)}>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
          Payoff Curve
        </div>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          Add positions to see payoff curve
        </div>
      </div>
    );
  }

  const yRange = Math.max(Math.abs(maxProfit), Math.abs(maxLoss)) * 1.2;
  const yMin = -yRange;
  const yMax = yRange;
  
  const xScale = (price: number) => padding.left + (price / 100) * innerWidth;
  const yScale = (pnl: number) => padding.top + innerHeight / 2 - (pnl / yRange) * (innerHeight / 2);

  const pathData = payoffData.map((d, i) => {
    const x = xScale(d.price);
    const y = yScale(d.pnl);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const profitAreaPath = payoffData
    .filter(d => d.pnl > 0)
    .map((d, i, arr) => {
      const x = xScale(d.price);
      const y = yScale(d.pnl);
      if (i === 0) return `M ${x} ${yScale(0)} L ${x} ${y}`;
      if (i === arr.length - 1) return `L ${x} ${y} L ${x} ${yScale(0)} Z`;
      return `L ${x} ${y}`;
    }).join(' ');

  const lossAreaPath = payoffData
    .filter(d => d.pnl < 0)
    .map((d, i, arr) => {
      const x = xScale(d.price);
      const y = yScale(d.pnl);
      if (i === 0) return `M ${x} ${yScale(0)} L ${x} ${y}`;
      if (i === arr.length - 1) return `L ${x} ${y} L ${x} ${yScale(0)} Z`;
      return `L ${x} ${y}`;
    }).join(' ');

  const currentPnL = payoffData.find(d => Math.abs(d.price - currentPrice * 100) < 1)?.pnl || 0;

  return (
    <div className={cn("border border-border bg-black p-3 font-mono", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Payoff Curve at Expiry
        </span>
        <div className="flex items-center gap-3 text-[9px]">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-terminal-green"></span>
            Profit
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-terminal-red"></span>
            Loss
          </span>
          {showTimeline && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-terminal-amber opacity-50"></span>
              Time Decay
            </span>
          )}
        </div>
      </div>

      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
        <defs>
          <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00ff41" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lossGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ff3333" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ff3333" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {[0, 25, 50, 75, 100].map(price => (
          <g key={price}>
            <line
              x1={xScale(price)}
              y1={padding.top}
              x2={xScale(price)}
              y2={chartHeight - padding.bottom}
              stroke="#1a3a1a"
              strokeWidth="1"
            />
            <text
              x={xScale(price)}
              y={chartHeight - padding.bottom + 15}
              fill="#00aa00"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {price}¢
            </text>
          </g>
        ))}
        
        <line
          x1={padding.left}
          y1={yScale(0)}
          x2={chartWidth - padding.right}
          y2={yScale(0)}
          stroke="#444"
          strokeWidth="1"
        />
        
        {[-yRange, -yRange/2, 0, yRange/2, yRange].map((val, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={yScale(val)}
              x2={chartWidth - padding.right}
              y2={yScale(val)}
              stroke="#1a3a1a"
              strokeWidth="1"
              strokeDasharray={val === 0 ? "0" : "2,2"}
            />
            <text
              x={padding.left - 5}
              y={yScale(val) + 3}
              fill="#00aa00"
              fontSize="8"
              fontFamily="monospace"
              textAnchor="end"
            >
              {val >= 0 ? '+' : ''}{val.toFixed(0)}
            </text>
          </g>
        ))}

        {showTimeline && timeDecayData.map((td, idx) => {
          const opacity = 0.3 + (idx * 0.15);
          const tdPath = td.data.map((d, i) => {
            const x = xScale(d.price);
            const y = yScale(d.pnl);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ');
          return (
            <path
              key={td.days}
              d={tdPath}
              fill="none"
              stroke="#ffcc00"
              strokeWidth="1"
              opacity={opacity}
              strokeDasharray="4,2"
            />
          );
        })}

        <path d={profitAreaPath} fill="url(#profitGradient)" />
        <path d={lossAreaPath} fill="url(#lossGradient)" />
        
        <path
          d={pathData}
          fill="none"
          stroke="#00ff41"
          strokeWidth="2"
        />
        
        <line
          x1={xScale(currentPrice * 100)}
          y1={padding.top}
          x2={xScale(currentPrice * 100)}
          y2={chartHeight - padding.bottom}
          stroke="#00ffff"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        <text
          x={xScale(currentPrice * 100)}
          y={padding.top - 5}
          fill="#00ffff"
          fontSize="8"
          fontFamily="monospace"
          textAnchor="middle"
        >
          Current: {(currentPrice * 100).toFixed(1)}¢
        </text>
        
        {breakevens.map((be, i) => (
          <g key={i}>
            <circle
              cx={xScale(be)}
              cy={yScale(0)}
              r="4"
              fill="#ffcc00"
              stroke="#000"
              strokeWidth="1"
            />
            <text
              x={xScale(be)}
              y={yScale(0) + 15}
              fill="#ffcc00"
              fontSize="8"
              fontFamily="monospace"
              textAnchor="middle"
            >
              BE: {be.toFixed(1)}¢
            </text>
          </g>
        ))}
        
        <circle
          cx={xScale(currentPrice * 100)}
          cy={yScale(currentPnL)}
          r="5"
          fill={currentPnL >= 0 ? "#00ff41" : "#ff3333"}
          stroke="#000"
          strokeWidth="2"
        />
      </svg>

      <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
        <div className="border border-border p-2 bg-black/50">
          <div className="text-[9px] text-muted-foreground uppercase">Max Profit</div>
          <div className="text-terminal-green font-bold">+${maxProfit.toFixed(2)}</div>
        </div>
        <div className="border border-border p-2 bg-black/50">
          <div className="text-[9px] text-muted-foreground uppercase">Max Loss</div>
          <div className="text-terminal-red font-bold">${maxLoss.toFixed(2)}</div>
        </div>
        <div className="border border-border p-2 bg-black/50">
          <div className="text-[9px] text-muted-foreground uppercase">Breakeven</div>
          <div className="text-terminal-amber font-bold">
            {breakevens.length > 0 ? `${breakevens[0].toFixed(1)}¢` : 'N/A'}
          </div>
        </div>
        <div className="border border-border p-2 bg-black/50">
          <div className="text-[9px] text-muted-foreground uppercase">Current P&L</div>
          <div className={cn("font-bold", currentPnL >= 0 ? "text-terminal-green" : "text-terminal-red")}>
            {currentPnL >= 0 ? '+' : ''}${currentPnL.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
