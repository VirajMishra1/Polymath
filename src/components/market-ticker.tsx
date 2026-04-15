'use client';

import { useEffect, useState } from 'react';

interface TickerItem {
  title: string;
  volume: number;
}

function formatVolume(vol: number) {
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(0)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
  return `$${vol}`;
}

export function MarketTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    fetch('/api/events?limit=20')
      .then(r => r.json())
      .then(data => {
        const events = data.events ?? [];
        setItems(
          events.map((e: { title: string; volume: number }) => ({
            title: e.title.toUpperCase(),
            volume: e.volume,
          }))
        );
      })
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div className="w-full overflow-hidden bg-black border-b border-border">
      <div className="flex animate-ticker whitespace-nowrap py-1">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center text-xs font-mono">
            <span className="text-white mx-2">•</span>
            <span className="text-white/70 uppercase tracking-wide">
              {item.title}
            </span>
            <span className="text-white/50 mx-1">::</span>
            <span className="text-white">{formatVolume(item.volume)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
