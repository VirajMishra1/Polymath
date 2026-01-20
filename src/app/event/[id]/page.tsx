'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Event, Market } from '@/lib/types';

function formatVolume(vol: number) {
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
  if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
  return `$${vol.toFixed(0)}`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return 'TBD';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function MarketCard({ market }: { market: Market }) {
  const priceYesPct = market.price_yes * 100;
  const priceNoPct = market.price_no * 100;

  return (
    <Link
      href={`/market/${market.id}`}
      className="group block border border-border p-3 hover:border-terminal-green/50 hover:bg-terminal-green/5 transition-all bg-black"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-mono text-sm text-terminal-green glow-text-subtle group-hover:glow-text transition-all line-clamp-2">
          {market.question}
        </h3>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-terminal-green transition-colors flex-shrink-0 mt-0.5" />
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex-1 border border-border p-2 bg-black">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-mono">
            {market.outcome_yes}
          </div>
          <div className={cn(
            "text-lg font-mono font-bold",
            priceYesPct >= 50 ? "text-terminal-green glow-text-subtle" : "text-foreground"
          )}>
            {priceYesPct.toFixed(0)}¢
          </div>
        </div>
        <div className="flex-1 border border-border p-2 bg-black">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-mono">
            {market.outcome_no}
          </div>
          <div className={cn(
            "text-lg font-mono font-bold",
            priceNoPct >= 50 ? "text-terminal-red" : "text-foreground"
          )}>
            {priceNoPct.toFixed(0)}¢
          </div>
        </div>
      </div>

      <div className="h-1 bg-border overflow-hidden mb-3">
        <div 
          className="h-full bg-terminal-green"
          style={{ width: `${priceYesPct}%`, boxShadow: '0 0 4px #00ff41' }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {formatVolume(market.volume)}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {formatVolume(market.liquidity)}
          </span>
        </div>
        <span className={cn(
          "px-2 py-0.5 border text-[10px] font-mono uppercase",
          market.status === 'active' ? "border-terminal-green text-terminal-green" : "border-border text-muted-foreground"
        )}>
          {market.status}
        </span>
      </div>
    </Link>
  );
}

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Event not found');
          } else {
            throw new Error('Failed to fetch event');
          }
          return;
        }
        const data = await response.json();
        setEvent(data.event);
        setMarkets(data.markets || []);
      } catch (err) {
        setError('Failed to load event');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 max-w-7xl mx-auto font-mono">
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-terminal-green animate-spin" />
          <span className="ml-3 text-terminal-green glow-text">Loading event data...</span>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-6 max-w-7xl mx-auto font-mono">
        <div className="text-center py-20">
          <h1 className="text-xl font-bold mb-2 text-terminal-green glow-text">Event Not Found</h1>
          <p className="text-muted-foreground mb-4">The event you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/" className="text-terminal-green hover:glow-text transition-all">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto font-mono">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-terminal-green transition-colors mb-4"
      >
        <ArrowLeft className="w-3 h-3" />
        Back
      </button>

      <div className="border border-border bg-black p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 border border-terminal-green text-terminal-green text-[10px] font-mono uppercase">
            {event.category || 'Event'}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {markets.length} markets
          </span>
          {event.active && (
            <span className="px-2 py-0.5 border border-terminal-green text-terminal-green text-[10px] font-mono uppercase animate-pulse">
              LIVE
            </span>
          )}
        </div>

        <h1 className="text-xl font-mono text-terminal-green glow-text mb-2">{event.title}</h1>
        <p className="text-muted-foreground text-sm font-mono mb-4">{event.description || 'No description available'}</p>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-2 border border-border">
            <TrendingUp className="w-3 h-3 text-terminal-green" />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">Volume</div>
              <div className="text-terminal-green glow-text-subtle">{formatVolume(event.volume)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 border border-border">
            <DollarSign className="w-3 h-3 text-terminal-green" />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">Liquidity</div>
              <div className="text-terminal-green glow-text-subtle">{formatVolume(event.liquidity)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 border border-border">
            <Calendar className="w-3 h-3 text-terminal-amber" />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase">End Date</div>
              <div className="text-terminal-amber">{formatDate(event.end_date)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-mono text-terminal-green uppercase tracking-wider glow-text-subtle">Markets</h2>
        <span className="text-xs text-muted-foreground font-mono">
          Click a market to open terminal view
        </span>
      </div>

      {markets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      ) : (
        <div className="border border-border p-12 text-center bg-black">
          <h3 className="font-mono text-terminal-green mb-2">No Markets Available</h3>
          <p className="text-sm text-muted-foreground font-mono">
            Markets for this event are not yet available.
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground font-mono">
        <span className="flex items-center gap-2">
          <kbd className="px-2 py-1 border border-border bg-black text-terminal-green">Esc</kbd>
          <span>Go back</span>
        </span>
        <span className="flex items-center gap-2">
          <kbd className="px-2 py-1 border border-border bg-black text-terminal-green">1-9</kbd>
          <span>Quick select market</span>
        </span>
      </div>
    </div>
  );
}
