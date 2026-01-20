'use client';

import { mockEvents } from '@/lib/mock-data';

const tickerItems = [
  ...mockEvents.map(e => ({
    title: e.title.toUpperCase(),
    volume: e.volume,
  })),
  { title: 'MICROSTRATEGY SELLS ANY BITCOIN BY ___', volume: 0 },
  { title: 'KRAKEN IPO BY ___', volume: 0 },
  { title: 'MACRON OUT BY...?', volume: 0 },
  { title: 'HOW MANY PEOPLE WILL TRUMP DEPORT IN 202...', volume: 0 },
  { title: 'WILL TRUMP DEPORT 750,000 OR MORE PEOPLE...', volume: 0 },
  { title: 'UK ELECTION 2025', volume: 0 },
];

function formatVolume(vol: number) {
  if (vol === 0) return '$0';
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(0)}M`;
  if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
  return `$${vol}`;
}

export function MarketTicker() {
  const items = [...tickerItems, ...tickerItems];

  return (
    <div className="w-full overflow-hidden bg-black border-b border-border">
      <div className="flex animate-ticker whitespace-nowrap py-1">
        {items.map((item, i) => (
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
