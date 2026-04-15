'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Clock, 
  ChevronRight,
  Flame,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { SearchBar } from '@/components/search-bar';
import { cn } from '@/lib/utils';
import type { Event } from '@/lib/types';

const categories = ['All', 'Politics', 'Sports', 'Crypto', 'Pop Culture', 'Business', 'Science'];

function formatVolume(vol: number) {
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
  if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
  return `$${vol.toFixed(0)}`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return 'TBD';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days < 0) return 'Ended';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
}

function EventRow({ event }: { event: Event }) {
  const isHot = event.volume > 100000000;
  const endingSoon = event.end_date && new Date(event.end_date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 && new Date(event.end_date).getTime() > Date.now();
  const isEnded = event.closed || (event.end_date && new Date(event.end_date).getTime() < Date.now());

  return (
    <Link
      href={`/event/${event.id}`}
      className="group flex items-center gap-4 px-4 py-4 hover:bg-terminal-green/5 transition-colors border-b border-border last:border-0"
    >
      <div className="w-16 h-12 border border-border flex items-center justify-center flex-shrink-0 overflow-hidden bg-black">
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-terminal-green/20 to-transparent" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="font-mono font-medium text-base text-terminal-green glow-text-subtle group-hover:glow-text transition-all line-clamp-1">
            {event.title}
          </h3>
          {isHot && (
            <span className="flex items-center gap-1 px-2 py-0.5 border border-terminal-amber text-terminal-amber text-[10px] font-mono uppercase flex-shrink-0">
              <Flame className="w-3 h-3" />
              HOT
            </span>
          )}
          {endingSoon && !isEnded && (
            <span className="flex items-center gap-1 px-2 py-0.5 border border-terminal-amber text-terminal-amber text-[10px] font-mono uppercase flex-shrink-0">
              <Clock className="w-3 h-3" />
              ENDING
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground font-mono mt-1 line-clamp-1">
          {event.description || 'No description available'}
        </p>
      </div>

      <div className="hidden md:flex items-center gap-8 flex-shrink-0">
          <div className="text-right min-w-[80px]">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Volume</div>
          <div className="text-base font-mono font-medium text-terminal-green">
            {formatVolume(event.volume)}
          </div>
        </div>
        
        <div className="text-right min-w-[80px]">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Liquidity</div>
          <div className="text-base font-mono text-terminal-green">
            {formatVolume(event.liquidity)}
          </div>
        </div>

        <div className="text-right min-w-[60px]">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Ends</div>
          <div className={cn(
            "text-base font-mono",
            isEnded ? "text-muted-foreground" : "text-terminal-amber"
          )}>
            {formatDate(event.end_date)}
          </div>
        </div>

        <div className="text-right min-w-[60px]">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Markets</div>
          <div className="text-base font-mono text-foreground">{event.markets_count}</div>
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-terminal-green transition-colors flex-shrink-0" />
    </Link>
  );
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/events?limit=50&active=true');
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data.events || []);
      setError(null);
    } catch (err) {
      setError('Failed to load events from Polymarket');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = selectedCategory === 'All' 
    ? events 
    : events.filter(e => e.category?.toLowerCase().includes(selectedCategory.toLowerCase()));

  if (loading) {
    return (
      <div className="p-4 max-w-7xl mx-auto font-mono">
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-terminal-green animate-spin" />
          <span className="ml-3 text-terminal-green glow-text">Loading live data from Polymarket...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto font-mono">
      <SearchBar className="mb-6 max-w-xl" />

      {error && (
        <div className="mb-4 p-3 border border-terminal-red bg-terminal-red/10 flex items-center gap-2 text-terminal-red text-sm font-mono">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-black">
          <div className="flex items-center gap-3">
            <h2 className="font-mono font-bold text-sm text-terminal-green uppercase tracking-wider glow-text-subtle">
              Live Events
            </h2>
            <span className="text-xs text-terminal-green font-mono border border-terminal-green/50 px-2 py-0.5">
              {filteredEvents.length}
            </span>
            <button 
              onClick={fetchEvents}
              disabled={refreshing}
              className="p-1 hover:bg-terminal-green/10 transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4 text-terminal-green", refreshing && "animate-spin")} />
            </button>
          </div>

          <div className="flex items-center overflow-x-auto">
            <div className="flex items-center">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-4 py-2 text-sm font-mono transition-colors whitespace-nowrap",
                    selectedCategory === cat 
                      ? "text-terminal-green border-b-2 border-terminal-green" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-border bg-black/50">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <EventRow key={event.id} event={event} />
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground font-mono">
              {events.length === 0 ? 'Loading events...' : 'No events found in this category'}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground font-mono">
        <span className="flex items-center gap-2">
          <kbd className="px-2 py-1 border border-border bg-black font-mono text-terminal-green">/</kbd>
          <span>Search</span>
        </span>
        <span className="flex items-center gap-2">
          <kbd className="px-2 py-1 border border-border bg-black font-mono text-terminal-green">J</kbd>
          <kbd className="px-2 py-1 border border-border bg-black font-mono text-terminal-green">K</kbd>
          <span>Navigate</span>
        </span>
        <span className="flex items-center gap-2">
          <kbd className="px-2 py-1 border border-border bg-black font-mono text-terminal-green">Enter</kbd>
          <span>Select</span>
        </span>
      </div>
    </div>
  );
}
