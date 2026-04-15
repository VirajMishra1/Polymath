'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { TimeseriesPoint } from '@/lib/types';
import type { PriceEvent } from '@/lib/market-articles';

interface PriceChartProps {
  data: TimeseriesPoint[];
  selection?: { start: string; end: string } | null;
  onSelectionChange?: (selection: { start: string; end: string } | null) => void;
  className?: string;
  showVolume?: boolean;
  marketId?: string;
  onEventClick?: (event: PriceEvent) => void;
}

export function PriceChart({ 
  data, 
  className,
  marketId,
  onEventClick
}: PriceChartProps) {
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | 'ALL'>('ALL');
  const [priceEvents, setPriceEvents] = useState<PriceEvent[]>([]);
  const [hoveredEvent, setHoveredEvent] = useState<PriceEvent | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!marketId || data.length < 5) return;
    
    async function fetchPriceEvents() {
      try {
        const priceHistory = data.map((p, idx) => ({
          timestamp: new Date(p.timestamp).getTime() / 1000,
          price: p.price,
          index: idx
        }));
        
        const response = await fetch('/api/price-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ marketId, priceHistory })
        });
        
        if (response.ok) {
          const result = await response.json();
          setPriceEvents(result.events || []);
        }
      } catch (error) {
        console.error('Failed to fetch price events:', error);
      }
    }
    
    fetchPriceEvents();
  }, [marketId, data]);

  const chartConfig = useMemo(() => {
    if (data.length === 0) return null;
    
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 0.1;
    const padding = priceRange * 0.1;
    
    return {
      minPrice: minPrice - padding,
      maxPrice: maxPrice + padding,
      currentPrice: prices[prices.length - 1],
      priceChange: ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100
    };
  }, [data]);

  const chartWidth = 800;
  const chartHeight = 200;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const xScale = (index: number) => paddingLeft + (index / (data.length - 1)) * innerWidth;
  const yScale = (price: number) => {
    if (!chartConfig) return paddingTop;
    const { minPrice, maxPrice } = chartConfig;
    return paddingTop + innerHeight - ((price - minPrice) / (maxPrice - minPrice)) * innerHeight;
  };

  const pathData = useMemo(() => {
    if (data.length === 0) return '';
    return data.map((point, i) => {
      const x = xScale(i);
      const y = yScale(point.price);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [data, chartConfig]);

  const areaPath = useMemo(() => {
    if (data.length === 0) return '';
    const linePath = data.map((point, i) => {
      const x = xScale(i);
      const y = yScale(point.price);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    const lastX = xScale(data.length - 1);
    const firstX = xScale(0);
    const bottomY = paddingTop + innerHeight;
    
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [data, chartConfig]);

  const eventDots = useMemo(() => {
    return priceEvents.map(event => {
      const dataIndex = data.findIndex(d => {
        const ts = new Date(d.timestamp).getTime() / 1000;
        return Math.abs(ts - event.timestamp) < 600;
      });
      
      if (dataIndex === -1) return null;
      
      return {
        ...event,
        dataIndex,
        cx: xScale(dataIndex),
        cy: yScale(event.price)
      };
    }).filter(Boolean) as (PriceEvent & { dataIndex: number; cx: number; cy: number })[];
  }, [priceEvents, data, chartConfig]);

  const handleDotClick = (event: PriceEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const handleDotHover = (event: PriceEvent | null, e?: React.MouseEvent) => {
    setHoveredEvent(event);
    if (event && e && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setTooltipPos({ 
        x: e.clientX - rect.left, 
        y: e.clientY - rect.top - 60 
      });
    } else {
      setTooltipPos(null);
    }
  };

  const yAxisTicks = useMemo(() => {
    if (!chartConfig) return [];
    const { minPrice, maxPrice } = chartConfig;
    const ticks = [];
    for (let i = 0; i <= 4; i++) {
      const price = minPrice + (maxPrice - minPrice) * (i / 4);
      ticks.push({
        price,
        y: yScale(price),
        label: `${(price * 100).toFixed(0)}¢`
      });
    }
    return ticks;
  }, [chartConfig]);

  const xAxisTicks = useMemo(() => {
    if (data.length === 0) return [];
    const tickCount = Math.min(6, data.length);
    const step = Math.floor(data.length / tickCount);
    return Array.from({ length: tickCount }, (_, i) => {
      const index = Math.min(i * step, data.length - 1);
      return {
        index,
        x: xScale(index),
        label: new Date(data[index].timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });
  }, [data]);

  if (data.length === 0 || !chartConfig) {
    return (
      <div className={cn("w-full font-mono", className)}>
        <div className="h-[200px] w-full border border-border bg-black flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Loading chart data...</span>
        </div>
      </div>
    );
  }

  const dipsCount = priceEvents.filter(e => e.type === 'dip').length;
  const spikesCount = priceEvents.filter(e => e.type === 'spike').length;

  return (
    <div className={cn("w-full font-mono", className)}>
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Price History
          </div>
          {priceEvents.length > 0 && (
            <div className="flex items-center gap-2 text-[9px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-terminal-red"></span>
                <span className="text-muted-foreground">{dipsCount} dips</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span className="text-muted-foreground">{spikesCount} spikes</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5 text-[10px]">
          {(['1D', '1W', '1M', 'ALL'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-2 py-0.5 transition-colors font-mono",
                timeRange === range 
                  ? "text-terminal-green glow-text-subtle" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {priceEvents.length > 0 && (
        <div className="mb-2 px-1 text-[9px] text-terminal-amber font-mono">
          Click on colored dots to see what caused price movements
        </div>
      )}

      <div className="relative border border-border bg-black" style={{ height: chartHeight }}>
        <svg 
          ref={svgRef}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="priceAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00ff41" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#00ff41" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="dipGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="spikeGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {yAxisTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={chartWidth - paddingRight}
                y2={tick.y}
                stroke="#1a3a1a"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 5}
                y={tick.y + 3}
                fill="#00aa00"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="end"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {xAxisTicks.map((tick, i) => (
            <text
              key={i}
              x={tick.x}
              y={chartHeight - 5}
              fill="#00aa00"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {tick.label}
            </text>
          ))}

          <path
            d={areaPath}
            fill="url(#priceAreaGradient)"
          />

          <path
            d={pathData}
            fill="none"
            stroke="#00ff41"
            strokeWidth="2"
            filter="url(#glow)"
          />

          {eventDots.map((dot, idx) => (
            <g 
              key={idx}
              style={{ cursor: 'pointer' }}
              onClick={(e) => handleDotClick(dot, e)}
              onMouseEnter={(e) => handleDotHover(dot, e)}
              onMouseLeave={() => handleDotHover(null)}
            >
              <circle
                cx={dot.cx}
                cy={dot.cy}
                r={6}
                fill={dot.type === 'dip' ? '#ef4444' : '#22d3ee'}
                opacity="0.25"
                filter={dot.type === 'dip' ? 'url(#dipGlow)' : 'url(#spikeGlow)'}
              />
              <circle
                cx={dot.cx}
                cy={dot.cy}
                r={4}
                fill={dot.type === 'dip' ? '#ef4444' : '#22d3ee'}
                stroke={dot.type === 'dip' ? '#dc2626' : '#06b6d4'}
                strokeWidth="1"
              />
            </g>
          ))}
        </svg>

        {hoveredEvent && tooltipPos && (
          <div 
            className="absolute z-10 pointer-events-none"
            style={{ left: tooltipPos.x, top: tooltipPos.y, transform: 'translateX(-50%)' }}
          >
            <div className={cn(
              "px-3 py-2 border font-mono text-[10px] bg-black",
              hoveredEvent.type === 'dip' ? "border-terminal-red" : "border-cyan-500"
            )}>
              <div className={cn(
                "font-bold mb-1",
                hoveredEvent.type === 'dip' ? "text-terminal-red" : "text-cyan-500"
              )}>
                {hoveredEvent.type === 'dip' ? '📉 DIP' : '📈 SPIKE'}
              </div>
              <div className="text-muted-foreground">
                {hoveredEvent.priceChangePct >= 0 ? '+' : ''}{hoveredEvent.priceChangePct.toFixed(1)}% from avg
              </div>
              <div className="text-terminal-amber mt-1">Click for analysis</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
