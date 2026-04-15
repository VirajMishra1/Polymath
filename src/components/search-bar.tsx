'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTerminalStore } from '@/lib/store';
import type { Market } from '@/lib/types';

interface SearchBarProps {
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({ className, autoFocus }: SearchBarProps) {
  const router = useRouter();
  const { searchQuery, setSearchQuery, keyboardShortcutsEnabled } = useTerminalStore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ markets: Market[] }>({ markets: [] });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults({ markets: [] });
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    
    try {
      const response = await fetch(
        `/api/markets?search=${encodeURIComponent(query)}&limit=15`,
        { signal: abortControllerRef.current.signal }
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setResults({ markets: data.markets || [] });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Search error:', err);
        setResults({ markets: [] });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      search(searchQuery);
    }, 150);
    return () => clearTimeout(debounce);
  }, [searchQuery, search]);

  useEffect(() => {
    if (!keyboardShortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          inputRef.current?.focus();
          setIsOpen(true);
        }
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcutsEnabled]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (type: 'market', id: string) => {
    setIsOpen(false);
    setSearchQuery('');
    router.push(`/market/${id}`);
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
    return `$${vol}`;
  };

  return (
    <div ref={containerRef} className={cn("relative font-mono", className)}>
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 border transition-all bg-black",
        isOpen ? "border-terminal-green glow-box" : "border-border hover:border-terminal-green/50"
      )}>
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search events, markets..."
          autoFocus={autoFocus}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-terminal-green font-mono"
        />
        {loading && <span className="text-terminal-green text-xs loading-cursor">SEARCHING</span>}
        {searchQuery && !loading && (
          <button
            onClick={() => setSearchQuery('')}
            className="p-0.5 hover:bg-terminal-green/10"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
        <kbd className="hidden sm:inline-flex h-5 px-1.5 text-[10px] text-muted-foreground border border-border bg-black font-mono">
          /
        </kbd>
      </div>

        {isOpen && (results.markets.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-black border border-border overflow-hidden z-50 max-h-[400px] overflow-y-auto scrollbar-terminal">
            <div>
              <div className="px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border font-mono">
                Markets ({results.markets.length})
              </div>
              {results.markets.map((market) => (
                <button
                  key={market.id}
                  onClick={() => handleSelect('market', market.id)}
                  className="w-full px-3 py-2 text-left hover:bg-terminal-green/10 transition-colors flex items-center gap-3 border-b border-border/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono text-foreground line-clamp-1">{market.question}</div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 font-mono">
                      <span className="text-terminal-green glow-text-subtle">
                        {(market.price_yes * 100).toFixed(0)}¢
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {formatVolume(market.volume)}
                      </span>
                      {market.volume_24h > 0 && (
                        <span className="text-terminal-amber">
                          24h: {formatVolume(market.volume_24h)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      {isOpen && searchQuery && !loading && results.markets.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-black border border-border p-4 z-50">
          <div className="text-sm text-muted-foreground text-center font-mono">
            No results found for &quot;{searchQuery}&quot;
          </div>
        </div>
      )}
    </div>
  );
}
