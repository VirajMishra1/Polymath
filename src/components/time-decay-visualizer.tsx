'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Clock, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface TimeDecayVisualizerProps {
  positions: {
    side: 'YES' | 'NO';
    quantity: number;
    avgPrice: number;
  }[];
  currentPrice: number;
  daysToExpiry: number;
  className?: string;
}

export function TimeDecayVisualizer({
  positions,
  currentPrice,
  daysToExpiry,
  className
}: TimeDecayVisualizerProps) {
  const [selectedDay, setSelectedDay] = useState(daysToExpiry);
  
  const timelineData = useMemo(() => {
    if (positions.length === 0) return [];
    
    const scenarios = [1, 3, 7, 14, 21, 30, 60, 90].filter(d => d <= daysToExpiry);
    if (!scenarios.includes(daysToExpiry)) scenarios.push(daysToExpiry);
    scenarios.sort((a, b) => a - b);
    
    return scenarios.map(days => {
      const timeRemaining = days / daysToExpiry;
      
      let expectedPnL = 0;
      let bestCase = 0;
      let worstCase = 0;
      
      positions.forEach(pos => {
        const cost = pos.quantity * pos.avgPrice;
        
        if (pos.side === 'YES') {
          const expectedFinal = currentPrice + (currentPrice > pos.avgPrice ? 0.1 : -0.1) * (1 - timeRemaining);
          const bestFinal = Math.min(1, currentPrice + 0.3 * (1 - timeRemaining));
          const worstFinal = Math.max(0, currentPrice - 0.3 * (1 - timeRemaining));
          
          expectedPnL += (pos.quantity * expectedFinal) - cost;
          bestCase += (pos.quantity * bestFinal) - cost;
          worstCase += (pos.quantity * worstFinal) - cost;
        } else {
          const expectedFinal = (1 - currentPrice) + ((1 - currentPrice) > pos.avgPrice ? 0.1 : -0.1) * (1 - timeRemaining);
          const bestFinal = Math.min(1, (1 - currentPrice) + 0.3 * (1 - timeRemaining));
          const worstFinal = Math.max(0, (1 - currentPrice) - 0.3 * (1 - timeRemaining));
          
          expectedPnL += (pos.quantity * expectedFinal) - cost;
          bestCase += (pos.quantity * bestFinal) - cost;
          worstCase += (pos.quantity * worstFinal) - cost;
        }
      });
      
      const theta = days > 1 ? -(expectedPnL / days) * 0.1 : 0;
      
      return {
        days,
        expectedPnL,
        bestCase,
        worstCase,
        theta,
        urgency: days <= 7 ? 'high' : days <= 14 ? 'medium' : 'low'
      };
    });
  }, [positions, currentPrice, daysToExpiry]);

  const chartWidth = 500;
  const chartHeight = 200;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const { maxVal, minVal } = useMemo(() => {
    if (timelineData.length === 0) return { maxVal: 100, minVal: -100 };
    const all = timelineData.flatMap(d => [d.bestCase, d.worstCase, d.expectedPnL]);
    return {
      maxVal: Math.max(...all) * 1.2,
      minVal: Math.min(...all) * 1.2
    };
  }, [timelineData]);

  const xScale = (days: number) => padding.left + ((daysToExpiry - days) / daysToExpiry) * innerWidth;
  const yScale = (pnl: number) => {
    const range = maxVal - minVal;
    return padding.top + innerHeight - ((pnl - minVal) / range) * innerHeight;
  };

  const selectedData = timelineData.find(d => d.days === selectedDay);

  if (positions.length === 0) {
    return (
      <div className={cn("border border-border bg-black p-4 font-mono", className)}>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-3 h-3" />
          Time Decay Analysis
        </div>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          Add positions to see time decay analysis
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border border-border bg-black p-3 font-mono", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-3 h-3" />
          Resolution Timing Scenarios
        </span>
        <span className="text-[9px] text-terminal-amber">
          {daysToExpiry} days to expiry
        </span>
      </div>

      <div className="flex gap-1 mb-3 flex-wrap">
        {timelineData.map(d => (
          <button
            key={d.days}
            onClick={() => setSelectedDay(d.days)}
            className={cn(
              "px-2 py-1 text-[10px] border transition-all",
              selectedDay === d.days
                ? d.urgency === 'high' 
                  ? "border-terminal-red bg-terminal-red/20 text-terminal-red"
                  : d.urgency === 'medium'
                    ? "border-terminal-amber bg-terminal-amber/20 text-terminal-amber"
                    : "border-terminal-green bg-terminal-green/20 text-terminal-green"
                : "border-border text-muted-foreground hover:border-terminal-green/50"
            )}
          >
            {d.days}d
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto mb-3">
        <line
          x1={padding.left}
          y1={yScale(0)}
          x2={chartWidth - padding.right}
          y2={yScale(0)}
          stroke="#444"
          strokeWidth="1"
        />
        
        {timelineData.length > 1 && (
          <>
            <path
              d={timelineData.map((d, i) => {
                const x = xScale(d.days);
                const y = yScale(d.bestCase);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#00ff41"
              strokeWidth="1"
              strokeDasharray="4,2"
              opacity="0.5"
            />
            
            <path
              d={timelineData.map((d, i) => {
                const x = xScale(d.days);
                const y = yScale(d.worstCase);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#ff3333"
              strokeWidth="1"
              strokeDasharray="4,2"
              opacity="0.5"
            />
            
            <path
              d={timelineData.map((d, i) => {
                const x = xScale(d.days);
                const y = yScale(d.expectedPnL);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#00ffff"
              strokeWidth="2"
            />
          </>
        )}
        
        {timelineData.map(d => (
          <g key={d.days}>
            <circle
              cx={xScale(d.days)}
              cy={yScale(d.expectedPnL)}
              r={selectedDay === d.days ? 6 : 4}
              fill={d.urgency === 'high' ? '#ff3333' : d.urgency === 'medium' ? '#ffcc00' : '#00ff41'}
              stroke="#000"
              strokeWidth="1"
              className="cursor-pointer"
              onClick={() => setSelectedDay(d.days)}
            />
            <text
              x={xScale(d.days)}
              y={chartHeight - 10}
              fill="#888"
              fontSize="8"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {d.days}d
            </text>
          </g>
        ))}
        
        <text
          x={padding.left}
          y={chartHeight - 5}
          fill="#888"
          fontSize="8"
          fontFamily="monospace"
        >
          Expiry
        </text>
        <text
          x={chartWidth - padding.right}
          y={chartHeight - 5}
          fill="#888"
          fontSize="8"
          fontFamily="monospace"
          textAnchor="end"
        >
          Now
        </text>
      </svg>

      {selectedData && (
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className={cn(
            "border p-2 bg-black/50",
            selectedData.urgency === 'high' ? "border-terminal-red" : 
            selectedData.urgency === 'medium' ? "border-terminal-amber" : "border-border"
          )}>
            <div className="text-[9px] text-muted-foreground uppercase flex items-center gap-1">
              {selectedData.urgency === 'high' && <AlertTriangle className="w-3 h-3 text-terminal-red" />}
              Time Left
            </div>
            <div className={cn(
              "font-bold",
              selectedData.urgency === 'high' ? "text-terminal-red" : 
              selectedData.urgency === 'medium' ? "text-terminal-amber" : "text-terminal-green"
            )}>
              {selectedData.days} days
            </div>
          </div>
          <div className="border border-border p-2 bg-black/50">
            <div className="text-[9px] text-muted-foreground uppercase flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-terminal-green" />
              Best Case
            </div>
            <div className="text-terminal-green font-bold">
              +${selectedData.bestCase.toFixed(2)}
            </div>
          </div>
          <div className="border border-border p-2 bg-black/50">
            <div className="text-[9px] text-muted-foreground uppercase">Expected</div>
            <div className={cn(
              "font-bold",
              selectedData.expectedPnL >= 0 ? "text-terminal-cyan" : "text-terminal-amber"
            )}>
              {selectedData.expectedPnL >= 0 ? '+' : ''}${selectedData.expectedPnL.toFixed(2)}
            </div>
          </div>
          <div className="border border-border p-2 bg-black/50">
            <div className="text-[9px] text-muted-foreground uppercase flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-terminal-red" />
              Worst Case
            </div>
            <div className="text-terminal-red font-bold">
              ${selectedData.worstCase.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 p-2 border border-border bg-black/30 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-terminal-amber font-bold">Resolution Impact:</span>
        </div>
        <p>
          If resolved in {selectedData?.days || daysToExpiry} days at current probability, 
          expected P&L is <span className={cn(
            "font-bold",
            (selectedData?.expectedPnL || 0) >= 0 ? "text-terminal-green" : "text-terminal-red"
          )}>
            {(selectedData?.expectedPnL || 0) >= 0 ? '+' : ''}${(selectedData?.expectedPnL || 0).toFixed(2)}
          </span>. 
          Earlier resolution generally {currentPrice > 0.5 ? 'favors' : 'hurts'} YES positions.
        </p>
      </div>
    </div>
  );
}
