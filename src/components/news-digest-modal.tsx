'use client';

import { useEffect, useState } from 'react';
import { X, Newspaper, RefreshCw, TrendingUp, TrendingDown, Minus, ExternalLink, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NewsDigest } from '@/app/api/news-digest/route';

interface Props {
  question: string;
  onClose: () => void;
}

function directionBadge(dir: NewsDigest['netDirection']) {
  switch (dir) {
    case 'BULLISH': return { label: 'BULLISH', cls: 'text-terminal-green border-terminal-green/50', icon: TrendingUp };
    case 'BEARISH': return { label: 'BEARISH', cls: 'text-terminal-red border-terminal-red/50', icon: TrendingDown };
    case 'MIXED': return { label: 'MIXED', cls: 'text-terminal-amber border-terminal-amber/50', icon: Minus };
    default: return { label: 'QUIET', cls: 'text-muted-foreground border-border', icon: Minus };
  }
}

function sentimentColor(s: 'BULLISH' | 'BEARISH' | 'NEUTRAL') {
  return s === 'BULLISH' ? 'text-terminal-green' : s === 'BEARISH' ? 'text-terminal-red' : 'text-muted-foreground';
}

function significanceDot(s: 'HIGH' | 'MEDIUM' | 'LOW') {
  return s === 'HIGH' ? 'bg-terminal-red' : s === 'MEDIUM' ? 'bg-terminal-amber' : 'bg-muted-foreground';
}

export function NewsDigestModal({ question, onClose }: Props) {
  const [digest, setDigest] = useState<NewsDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/news-digest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? 'Digest failed');
          return;
        }
        setDigest(data.digest);
      } catch {
        if (!cancelled) setError('Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [question]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const badge = digest ? directionBadge(digest.netDirection) : null;
  const Icon = badge?.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-black border border-cyan-500/50 w-full max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-terminal font-mono"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-black border-b border-border px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Newspaper className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-cyan-400 uppercase tracking-widest">News Digest · 30d</span>
            {badge && Icon && (
              <span className={cn('text-[10px] px-2 py-0.5 border flex items-center gap-1', badge.cls)}>
                <Icon className="w-3 h-3" />
                {badge.label}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading && (
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 text-cyan-400 mx-auto mb-3 animate-spin" />
            <p className="text-sm text-muted-foreground">Synthesizing 30 days of coverage...</p>
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-terminal-red text-sm">{error}</div>
        )}

        {digest && !loading && (
          <div className="p-4 space-y-4">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Question</div>
              <p className="text-sm text-foreground">{question}</p>
            </div>

            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Narrative Summary</div>
              <p className="text-sm text-terminal-green leading-relaxed">{digest.summary}</p>
            </div>

            {digest.themes.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Key Themes</div>
                <div className="space-y-1">
                  {digest.themes.map((t, i) => (
                    <div key={i} className="flex items-center justify-between border border-border px-3 py-2">
                      <span className="text-xs text-foreground">{t.label}</span>
                      <div className="flex items-center gap-3">
                        <span className={cn('text-[10px] font-bold', sentimentColor(t.sentiment))}>
                          {t.sentiment}
                        </span>
                        <span className="text-[10px] text-muted-foreground">×{t.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {digest.timeline.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Timeline
                </div>
                <div className="space-y-2">
                  {digest.timeline.map((evt, i) => (
                    <div key={i} className="flex items-start gap-2 border-l border-border pl-3 py-1">
                      <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', significanceDot(evt.significance))} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-muted-foreground">{evt.timestamp}</div>
                        <div className="text-xs text-foreground">{evt.headline}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {digest.catalystsToWatch.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Catalysts to Watch</div>
                <ul className="space-y-1">
                  {digest.catalystsToWatch.map((c, i) => (
                    <li key={i} className="text-xs text-terminal-amber flex items-start gap-2">
                      <span className="text-muted-foreground">→</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {digest.headlines.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                  Source Headlines ({digest.headlines.length})
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-terminal">
                  {digest.headlines.map(h => (
                    <a
                      key={h.id}
                      href={h.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 border border-border px-3 py-2 hover:border-cyan-500/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-terminal-green group-hover:glow-text line-clamp-2">{h.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {h.source} · {h.timestamp}
                        </div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-cyan-400 flex-shrink-0 mt-0.5" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
