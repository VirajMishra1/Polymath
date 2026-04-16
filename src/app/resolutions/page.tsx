'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResolvingEvent } from '@/app/api/resolutions/route';

interface Response {
  events: ResolvingEvent[];
  total: number;
  horizonDays: number;
  timestamp: number;
}

const HORIZONS = [
  { label: '24h', days: 1 },
  { label: '3d', days: 3 },
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
];

function formatVolume(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function formatCountdown(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = Math.floor(hours / 24);
  const remHours = Math.round(hours - days * 24);
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

function bucketColor(bucket: ResolvingEvent['bucket']) {
  switch (bucket) {
    case '24h': return 'text-terminal-red border-terminal-red/50';
    case '3d': return 'text-terminal-amber border-terminal-amber/50';
    case '7d': return 'text-cyan-400 border-cyan-400/50';
    case '14d': return 'text-terminal-green border-terminal-green/50';
    default: return 'text-muted-foreground border-border';
  }
}

export default function ResolutionsPage() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [horizon, setHorizon] = useState(7);

  async function load(days: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/resolutions?days=${days}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Failed to load');
        return;
      }
      setData(json);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(horizon);
  }, [horizon]);

  // Group by bucket for the UI
  const grouped = data?.events.reduce<Record<string, ResolvingEvent[]>>((acc, e) => {
    (acc[e.bucket] ||= []).push(e);
    return acc;
  }, {}) ?? {};
  const bucketOrder: ResolvingEvent['bucket'][] = ['24h', '3d', '7d', '14d', '30d'];

  return (
    <div className="p-4 max-w-5xl mx-auto font-mono">
      <div className="border border-border bg-black mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h1 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">
              Resolution Calendar
            </h1>
          </div>
          <button
            onClick={() => load(horizon)}
            disabled={loading}
            className={cn(
              'px-3 py-1 text-[11px] font-mono border transition-all flex items-center gap-2',
              loading
                ? 'border-cyan-500/50 text-cyan-500/50 animate-pulse'
                : 'border-border text-muted-foreground hover:text-cyan-400 hover:border-cyan-400/50'
            )}
          >
            <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
            {loading ? 'Loading' : 'Refresh'}
          </button>
        </div>
        <div className="px-4 py-3">
          <p className="text-[11px] text-muted-foreground mb-3">
            Events resolving soon — ranked by countdown, then volume. Event risk concentrates at resolution;
            this is when fast-money opportunities and liquidity spikes tend to appear.
          </p>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Horizon:</span>
            <div className="flex border border-border">
              {HORIZONS.map(h => (
                <button
                  key={h.days}
                  onClick={() => setHorizon(h.days)}
                  className={cn(
                    'px-3 py-1 text-[10px] font-mono uppercase transition-all',
                    horizon === h.days
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {h.label}
                </button>
              ))}
            </div>
            {data && (
              <span className="text-[10px] text-muted-foreground ml-auto">
                {data.total} event{data.total === 1 ? '' : 's'} found
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="border border-terminal-red bg-black p-4 text-sm text-terminal-red">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="border border-border bg-black p-8 text-center">
          <RefreshCw className="w-6 h-6 text-cyan-400 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading calendar...</p>
        </div>
      )}

      {data && data.events.length === 0 && (
        <div className="border border-border bg-black p-8 text-center">
          <p className="text-sm text-muted-foreground">No events resolving in the next {data.horizonDays} days.</p>
        </div>
      )}

      {data && data.events.length > 0 && (
        <div className="space-y-4">
          {bucketOrder.map(bucket => {
            const items = grouped[bucket];
            if (!items?.length) return null;
            return (
              <div key={bucket} className="border border-border bg-black">
                <div className="px-4 py-2 border-b border-border flex items-center gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className={cn('text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 border', bucketColor(bucket))}>
                    {bucket === '24h' ? 'Within 24 hours' : bucket === '3d' ? '1–3 days' : bucket === '7d' ? '3–7 days' : bucket === '14d' ? '1–2 weeks' : '2–4 weeks'}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{items.length}</span>
                </div>
                <div className="divide-y divide-border">
                  {items.map(e => (
                    <Link
                      key={e.eventId}
                      href={`/event/${e.slug}`}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 border font-mono flex-shrink-0 mt-0.5',
                        bucketColor(e.bucket)
                      )}>
                        {formatCountdown(e.hoursUntilResolution)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-terminal-green hover:glow-text line-clamp-2">
                          {e.title}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground">
                          <span>{e.marketsCount} market{e.marketsCount === 1 ? '' : 's'}</span>
                          <span>Vol: <span className="text-terminal-green">{formatVolume(e.volume)}</span></span>
                          <span>Liq: <span className="text-terminal-green">{formatVolume(e.liquidity)}</span></span>
                          {e.category !== 'Other' && (
                            <span className="text-muted-foreground/70">{e.category}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                        {new Date(e.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
