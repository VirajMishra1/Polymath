'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Newspaper, ChevronRight, X, ExternalLink, Loader2 } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  url?: string;
}

interface NewsTickerProps {
  query: string;
}

export function NewsTicker({ query }: NewsTickerProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    async function fetchNews() {
      try {
        const response = await fetch(`/api/news?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setNews(data.news || []);
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, [query]);

  const handleItemClick = async (item: NewsItem) => {
    setSelectedItem(item);
    setSummary(null);
    setSummarizing(true);
    
    try {
      const response = await fetch('/api/news/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: item.title,
          source: item.source,
          url: item.url,
        }),
      });
      
      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Failed to summarize:', error);
      setSummary('ERROR: FAILED TO RETRIEVE ANALYSIS.');
    } finally {
      setSummarizing(false);
    }
  };

  const closeSummary = () => {
    setSelectedItem(null);
    setSummary(null);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-border/50 border border-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden font-mono relative">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Newspaper className="w-3 h-3 text-white" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Live News Feed</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[9px] text-white">LIVE</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden group">
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
        
        <div className="animate-marquee-vertical py-1 space-y-0.5">
            {[...news, ...news].map((item, idx) => (
              <div 
                key={`${item.id}-${idx}`}
                onClick={() => handleItemClick(item)}
                className="p-1 border-l-2 border-transparent hover:border-white hover:bg-white/5 transition-all cursor-pointer group/item"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[7px] text-white/70 bg-white/10 px-1 uppercase">{item.source}</span>
                  <span className="text-[7px] text-muted-foreground">{item.timestamp}</span>
                </div>
                <div className="text-[9px] leading-tight text-muted-foreground group-hover/item:text-white transition-colors line-clamp-2">
                  <span className="text-white mr-1 font-bold">»</span>
                  {item.title}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Summary Overlay */}
      {selectedItem && (
        <div className="absolute inset-0 z-20 bg-black/90 backdrop-blur-sm border border-terminal-green/30 p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-terminal-green/30">
            <span className="text-[9px] text-terminal-green font-bold uppercase tracking-widest">Analysis: {selectedItem.source}</span>
            <button onClick={closeSummary} className="text-muted-foreground hover:text-terminal-green transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-terminal pr-1">
            <h3 className="text-[11px] text-terminal-green font-bold mb-2 leading-tight">
              {selectedItem.title}
            </h3>
            
            <div className="text-[10px] text-muted-foreground leading-relaxed">
              {summarizing ? (
                <div className="flex items-center gap-2 py-4 text-terminal-green/70">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="animate-pulse">RUNNING AI ANALYSIS...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="border-l border-terminal-green/20 pl-2 italic">
                    {summary}
                  </div>
                  {selectedItem.url && (
                      <button 
                        className="inline-flex items-center gap-1.5 text-terminal-green hover:underline pt-2 text-[9px] uppercase font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedItem.url) {
                            window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: selectedItem.url } }, "*");
                          }
                        }}
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        View Full Article
                      </button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-2 pt-1 border-t border-terminal-green/30 text-[8px] text-terminal-green/50 flex justify-between">
            <span>GEMINI-1.5-FLASH-ENGINE</span>
            <span>SECURE TERMINAL</span>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes marquee-vertical {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-marquee-vertical {
          animation: marquee-vertical 30s linear infinite;
        }
        .animate-marquee-vertical:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
