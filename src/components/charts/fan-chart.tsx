'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { MonteCarloResult } from '@/lib/types';

interface FanChartProps {
  data: MonteCarloResult;
  className?: string;
}

export function FanChart({ data, className }: FanChartProps) {
  const chartData = useMemo(() => {
    return data.timestamps.map((timestamp, i) => ({
      timestamp,
      time: new Date(timestamp).getTime(),
      displayTime: new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      p5: data.quantiles.p5[i] * 100,
      p25: data.quantiles.p25[i] * 100,
      p50: data.quantiles.p50[i] * 100,
      p75: data.quantiles.p75[i] * 100,
      p95: data.quantiles.p95[i] * 100,
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (!active || !payload || !payload.length) return null;
    const point = payload[0].payload;
    
    return (
      <div className="bg-black border border-terminal-green/50 px-3 py-2 font-mono">
        <div className="text-xs text-muted-foreground mb-2">{point.displayTime}</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">P95:</span>
            <span className="text-terminal-green">{point.p95.toFixed(1)}¢</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">P75:</span>
            <span className="text-terminal-green">{point.p75.toFixed(1)}¢</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">P50:</span>
            <span className="text-terminal-green font-bold">{point.p50.toFixed(1)}¢</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">P25:</span>
            <span className="text-terminal-amber">{point.p25.toFixed(1)}¢</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">P5:</span>
            <span className="text-terminal-red">{point.p5.toFixed(1)}¢</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("w-full font-mono", className)}>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-medium text-terminal-green">Monte Carlo Projection</span>
          <span className="text-xs text-muted-foreground">
            {data.simulations.toLocaleString()} simulations • {data.time_horizon_days}d horizon
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">VaR (95%):</span>
          <span className="text-terminal-red">
            {(data.var_95 * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="h-[250px] w-full border border-border bg-black">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <defs>
              <linearGradient id="p95Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff00" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00ff00" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="p75Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff00" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00ff00" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="p25Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffaa00" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ffaa00" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="p5Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff3333" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ff3333" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="displayTime"
              axisLine={{ stroke: '#003300' }}
              tickLine={false}
              tick={{ fill: '#00aa00', fontSize: 10, fontFamily: 'monospace' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['dataMin - 5', 'dataMax + 5']}
              axisLine={{ stroke: '#003300' }}
              tickLine={false}
              tick={{ fill: '#00aa00', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(v) => `${v.toFixed(0)}¢`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="p95"
              stroke="#00ff00"
              strokeWidth={1}
              fill="url(#p95Gradient)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="p75"
              stroke="#00cc00"
              strokeWidth={1}
              fill="url(#p75Gradient)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="p50"
              stroke="#00ff00"
              strokeWidth={2}
              fill="none"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="p25"
              stroke="#ffaa00"
              strokeWidth={1}
              fill="url(#p25Gradient)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="p5"
              stroke="#ff3333"
              strokeWidth={1}
              fill="url(#p5Gradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-terminal-green rounded" />
          <span className="text-muted-foreground">P95</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-terminal-green/70 rounded" />
          <span className="text-muted-foreground">P75</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-terminal-green rounded" />
          <span className="text-muted-foreground">P50 (Median)</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-terminal-amber rounded" />
          <span className="text-muted-foreground">P25</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-terminal-red rounded" />
          <span className="text-muted-foreground">P5</span>
        </span>
      </div>
    </div>
  );
}
