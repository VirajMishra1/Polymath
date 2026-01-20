'use client';

import { use, useMemo, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTerminalStore } from '@/lib/store';
import { usePortfolioStore } from '@/lib/portfolio-store';
import { RefreshCw, Brain, TrendingUp, TrendingDown, Minus, X, BarChart3, Shuffle, Shield, Calculator, Sparkles, Newspaper, MessageSquare, Zap, Briefcase } from 'lucide-react';
import { PriceChart } from '@/components/charts/price-chart';
import { Orderbook } from '@/components/orderbook';
import { NewsTicker } from '@/components/news-ticker';
import { PositionBuilder } from '@/components/position-builder';
import { PayoffCurve } from '@/components/charts/payoff-curve';
import { TimeDecayVisualizer } from '@/components/time-decay-visualizer';
import { ExternalHedgePanel } from '@/components/external-hedge-panel';
import type { Market, Orderbook as OrderbookType, TimeseriesPoint } from '@/lib/types';
import type { PriceEvent, MarketArticle } from '@/lib/market-articles';

interface MonteCarloResult {
  simulationCount: number;
  timeSteps: number;
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    percentile5: number;
    percentile25: number;
    percentile75: number;
    percentile95: number;
    min: number;
    max: number;
    probUp: number;
    probDown: number;
  };
  paths: {
    best: number[];
    worst: number[];
    median: number[];
    samples: number[][];
  };
}

interface ScenarioResult {
  priceShock: number;
  newPrice: number;
  pnl: number;
  pnlPercent: number;
  isProfit: boolean;
}

interface HedgeStrategy {
  name: string;
  description: string;
  hedgeSize: number;
  hedgeCost: number;
  riskReduction: number;
  maxLoss: number;
}

interface HedgeResult {
  strategies: HedgeStrategy[];
  correlatedMarkets: { name: string; correlation: number; hedgeRatio: number }[];
  optimalHedgeRatio: number;
  unhedgedRisk: number;
  recommendedStrategy: string;
}

interface CompressionResult {
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
  compressedText: string;
}

interface AIAnalysisResult {
  success: boolean;
  timestamp: string;
  model: string;
  prediction: {
    direction: 'YES' | 'NO' | 'NEUTRAL';
    probability: number;
    confidence: number;
  };
  analysis: {
    signals: string[];
    reasoning: string;
    metrics: {
      momentum: number;
      volatility: number;
      rsi: number;
      orderImbalance: number;
      trend: string;
    };
  };
  features: {
    currentPrice: number;
    sma5: number;
    sma10: number;
    sma20: number;
  };
  monteCarlo: MonteCarloResult;
  scenarios: ScenarioResult[];
  hedge: HedgeResult;
  historicalPrices: number[];
  compression?: CompressionResult | null;
}

type AnalysisMode = 'ai' | 'math';
type MathTab = 'scenario' | 'montecarlo' | 'hedge';

function SimulationChart({ 
  historicalPrices, 
  monteCarlo, 
  currentPrice 
}: { 
  historicalPrices: number[]; 
  monteCarlo: MonteCarloResult;
  currentPrice: number;
}) {
  const chartHeight = 200;
  const chartWidth = 500;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  
  const historicalLength = historicalPrices.length;
  const simulationLength = monteCarlo.paths.best.length;
  const totalLength = historicalLength + simulationLength;
  
  const allValues = [
    ...historicalPrices,
    ...monteCarlo.paths.best,
    ...monteCarlo.paths.worst,
    ...monteCarlo.paths.median
  ];
  const minPrice = Math.min(...allValues) * 0.95;
  const maxPrice = Math.max(...allValues) * 1.05;
  
  const xScale = (i: number) => padding.left + (i / (totalLength - 1)) * innerWidth;
  const yScale = (price: number) => 
    padding.top + innerHeight - ((price - minPrice) / (maxPrice - minPrice)) * innerHeight;
  
  const createPath = (prices: number[], startIdx: number = 0) => {
    return prices.map((p, i) => {
      const x = xScale(startIdx + i);
      const y = yScale(p);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
      <line 
        x1={xScale(historicalLength - 1)} 
        y1={padding.top} 
        x2={xScale(historicalLength - 1)} 
        y2={chartHeight - padding.bottom}
        stroke="#666"
        strokeDasharray="4,4"
        strokeWidth="1"
      />
      <text 
        x={xScale(historicalLength - 1)} 
        y={chartHeight - 8} 
        fill="#666" 
        fontSize="9" 
        textAnchor="middle"
        fontFamily="monospace"
      >
        NOW
      </text>
      
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const price = minPrice + (maxPrice - minPrice) * (1 - pct);
        const y = padding.top + innerHeight * pct;
        return (
          <g key={pct}>
            <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#333" strokeWidth="1" />
            <text x={padding.left - 5} y={y + 3} fill="#666" fontSize="8" textAnchor="end" fontFamily="monospace">
              {(price * 100).toFixed(0)}¢
            </text>
          </g>
        );
      })}
      
      <path d={createPath(historicalPrices)} fill="none" stroke="#22c55e" strokeWidth="2" />
      
      {monteCarlo.paths.samples.map((sample, idx) => (
        <path 
          key={idx}
          d={createPath(sample, historicalLength - 1)} 
          fill="none" 
          stroke="#666" 
          strokeWidth="0.5" 
          opacity="0.3"
        />
      ))}
      
      <path 
        d={createPath(monteCarlo.paths.worst, historicalLength - 1)} 
        fill="none" 
        stroke="#ef4444" 
        strokeWidth="2" 
        strokeDasharray="4,2"
      />
      
      <path 
        d={createPath(monteCarlo.paths.best, historicalLength - 1)} 
        fill="none" 
        stroke="#3b82f6" 
        strokeWidth="2" 
        strokeDasharray="4,2"
      />
      
      <path 
        d={createPath(monteCarlo.paths.median, historicalLength - 1)} 
        fill="none" 
        stroke="#f59e0b" 
        strokeWidth="2.5" 
      />
      
      <circle cx={xScale(historicalLength - 1)} cy={yScale(currentPrice)} r="4" fill="#22c55e" />
    </svg>
  );
}

function ScenarioChart({ scenarios }: { scenarios: ScenarioResult[] }) {
  const chartHeight = 180;
  const chartWidth = 500;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  
  const maxPnl = Math.max(...scenarios.map(s => Math.abs(s.pnl)));
  const barWidth = innerWidth / scenarios.length - 4;
  
  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
      <line 
        x1={padding.left} 
        y1={padding.top + innerHeight / 2} 
        x2={chartWidth - padding.right} 
        y2={padding.top + innerHeight / 2}
        stroke="#666"
        strokeWidth="1"
      />
      <text 
        x={padding.left - 5} 
        y={padding.top + innerHeight / 2 + 3} 
        fill="#666" 
        fontSize="8" 
        textAnchor="end"
        fontFamily="monospace"
      >
        $0
      </text>
      
      {scenarios.map((s, i) => {
        const x = padding.left + (i / scenarios.length) * innerWidth + 2;
        const barHeight = (Math.abs(s.pnl) / maxPnl) * (innerHeight / 2 - 10);
        const y = s.pnl >= 0 
          ? padding.top + innerHeight / 2 - barHeight 
          : padding.top + innerHeight / 2;
        
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={s.pnl >= 0 ? '#22c55e' : '#ef4444'}
              opacity="0.8"
            />
            <text 
              x={x + barWidth / 2} 
              y={chartHeight - padding.bottom + 12} 
              fill="#888" 
              fontSize="7" 
              textAnchor="middle"
              fontFamily="monospace"
            >
              {s.priceShock >= 0 ? '+' : ''}{(s.priceShock * 100).toFixed(0)}¢
            </text>
            <text 
              x={x + barWidth / 2} 
              y={chartHeight - padding.bottom + 24} 
              fill="#666" 
              fontSize="6" 
              textAnchor="middle"
              fontFamily="monospace"
            >
              ${s.pnl.toFixed(0)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ArticleCard({ article }: { article: MarketArticle }) {
  const sourceIcon = {
    news: <Newspaper className="w-3 h-3" />,
    reddit: <MessageSquare className="w-3 h-3" />,
    twitter: <span className="text-[10px] font-bold">𝕏</span>,
    analysis: <BarChart3 className="w-3 h-3" />
  };
  
  const sourceColor = {
    news: 'text-blue-400 border-blue-400/50',
    reddit: 'text-orange-400 border-orange-400/50',
    twitter: 'text-white border-white/50',
    analysis: 'text-purple-400 border-purple-400/50'
  };

  return (
    <div className="border border-border p-3 bg-black/50 hover:border-terminal-green/50 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={cn("p-1 border rounded", sourceColor[article.sourceType])}>
            {sourceIcon[article.sourceType]}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">{article.source}</span>
        </div>
        <span className={cn(
          "text-[9px] px-1.5 py-0.5 border font-mono",
          article.sentiment === 'bullish' ? "text-terminal-green border-terminal-green/50" :
          article.sentiment === 'bearish' ? "text-terminal-red border-terminal-red/50" :
          "text-terminal-amber border-terminal-amber/50"
        )}>
          {article.sentiment.toUpperCase()}
        </span>
      </div>
      <h4 className="text-sm font-mono text-terminal-green mb-2 leading-tight">{article.title}</h4>
      <p className="text-[11px] text-muted-foreground font-mono mb-2 leading-relaxed">{article.summary}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {article.keyPoints.slice(0, 3).map((point, i) => (
          <span key={i} className="text-[9px] px-1.5 py-0.5 bg-terminal-green/10 text-terminal-green font-mono">
            {point}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
        <span>Impact: {article.impactScore}/10</span>
      </div>
    </div>
  );
}

function PriceEventModal({ 
  event, 
  onClose,
  allArticles 
}: { 
  event: PriceEvent; 
  onClose: () => void;
  allArticles: MarketArticle[];
}) {
  const [showAllArticles, setShowAllArticles] = useState(false);
  
  const displayArticles = showAllArticles ? allArticles : event.articles;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className={cn(
        "bg-black border w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden flex flex-col",
        event.type === 'dip' ? "border-terminal-red" : "border-cyan-500"
      )}>
        <div className={cn(
          "sticky top-0 bg-black border-b p-3 flex items-center justify-between",
          event.type === 'dip' ? "border-terminal-red" : "border-cyan-500"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              event.type === 'dip' ? "bg-terminal-red/20" : "bg-cyan-500/20"
            )}>
              {event.type === 'dip' ? (
                <TrendingDown className="w-5 h-5 text-terminal-red" />
              ) : (
                <TrendingUp className="w-5 h-5 text-cyan-500" />
              )}
            </div>
            <div>
              <div className={cn(
                "text-sm font-bold font-mono uppercase",
                event.type === 'dip' ? "text-terminal-red" : "text-cyan-500"
              )}>
                Price {event.type === 'dip' ? 'Dip' : 'Spike'} Analysis
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {new Date(event.timestamp * 1000).toLocaleString()}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-border p-3 bg-black/50">
              <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">Price Change</div>
              <div className={cn(
                "text-xl font-bold font-mono",
                event.priceChange < 0 ? "text-terminal-red" : "text-cyan-500"
              )}>
                {event.priceChange >= 0 ? '+' : ''}{(event.priceChange * 100).toFixed(2)}¢
              </div>
            </div>
            <div className="border border-border p-3 bg-black/50">
              <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">% Change</div>
              <div className={cn(
                "text-xl font-bold font-mono",
                event.priceChangePct < 0 ? "text-terminal-red" : "text-cyan-500"
              )}>
                {event.priceChangePct >= 0 ? '+' : ''}{event.priceChangePct.toFixed(1)}%
              </div>
            </div>
            <div className="border border-border p-3 bg-black/50">
              <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">Significance</div>
              <div className="text-xl font-bold font-mono text-terminal-amber">
                {event.significance}/10
              </div>
            </div>
          </div>

          <div className={cn(
            "border p-4 bg-black/50",
            event.type === 'dip' ? "border-terminal-red/50" : "border-cyan-500/50"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Brain className={cn(
                "w-4 h-4",
                event.type === 'dip' ? "text-terminal-red" : "text-cyan-500"
              )} />
              <span className="text-[10px] text-muted-foreground uppercase font-mono">AI Analysis</span>
            </div>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed">
              {event.aiAnalysis || `This ${Math.abs(event.priceChangePct).toFixed(1)}% ${event.type} occurred due to market dynamics. Click "View All Articles" to explore related news and discussions.`}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] text-muted-foreground uppercase font-mono flex items-center gap-2">
                <Newspaper className="w-3 h-3" />
                {showAllArticles ? 'All Related Articles' : 'Articles Around This Time'} ({displayArticles.length})
              </div>
              <button
                onClick={() => setShowAllArticles(!showAllArticles)}
                className={cn(
                  "text-[10px] font-mono px-2 py-1 border transition-colors",
                  showAllArticles 
                    ? "border-terminal-green text-terminal-green" 
                    : "border-muted-foreground text-muted-foreground hover:border-terminal-green hover:text-terminal-green"
                )}
              >
                {showAllArticles ? 'Show Relevant Only' : 'View All Articles'}
              </button>
            </div>
            
            {displayArticles.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-terminal">
                {displayArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="border border-border p-4 text-center">
                <p className="text-sm text-muted-foreground font-mono">No articles found around this time period.</p>
                <button
                  onClick={() => setShowAllArticles(true)}
                  className="mt-2 text-[10px] font-mono text-terminal-green hover:underline"
                >
                  View all market articles
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-border p-3 bg-black">
          <div className="text-[9px] text-muted-foreground font-mono text-center">
            Analysis based on news sentiment, social media discussions, and market data
          </div>
        </div>
      </div>
    </div>
  );
}

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

interface ApiOrderbook {
  bids: { price: string; size: string }[];
  asks: { price: string; size: string }[];
}

interface PriceHistoryPoint {
  t: number;
  p: number;
}

export default function MarketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { chartSelection, setChartSelection, keyboardShortcutsEnabled } = useTerminalStore();

  const [market, setMarket] = useState<Market | null>(null);
  const [orderbook, setOrderbook] = useState<OrderbookType | null>(null);
  const [priceHistory, setPriceHistory] = useState<TimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [showCalculatingModal, setShowCalculatingModal] = useState(false);
    const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('ai');
    const [mathTab, setMathTab] = useState<MathTab>('montecarlo');
    const [positionSize, setPositionSize] = useState(100);
    const [avgPrice, setAvgPrice] = useState(50);
    const [selectedAnalysisType, setSelectedAnalysisType] = useState<AnalysisMode>('ai');
    const [activeTab, setActiveTab] = useState<'trade' | 'payoff' | 'timing' | 'hedge'>('trade');
    
    const [selectedPriceEvent, setSelectedPriceEvent] = useState<PriceEvent | null>(null);
    const [allMarketArticles, setAllMarketArticles] = useState<MarketArticle[]>([]);
    
    const { positions } = usePortfolioStore();
    
    const marketPositions = useMemo(() => {
      return positions.filter(p => p.marketId === id).map(p => ({
        side: p.side,
        quantity: p.quantity,
        avgPrice: p.avgPrice
      }));
    }, [positions, id]);
    
    const daysToExpiry = useMemo(() => {
      if (!market?.end_date) return 30;
      const endDate = new Date(market.end_date);
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();
      return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }, [market?.end_date]);

  useEffect(() => {
    async function fetchMarket() {
      try {
        const response = await fetch(`/api/markets/${id}?orderbook=true&history=true&interval=1w`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Market not found');
          } else {
            throw new Error('Failed to fetch market');
          }
          return;
        }
        const data = await response.json();
        setMarket(data.market);
        
        if (data.market?.price_yes) {
          setAvgPrice(data.market.price_yes * 100);
        }
        
        if (data.orderbook) {
          const apiOrderbook: ApiOrderbook = data.orderbook;
          let bidTotal = 0;
          let askTotal = 0;
          
          const bids = (apiOrderbook.bids || []).slice(0, 15).map((b: { price: string; size: string }) => {
            const size = parseFloat(b.size);
            bidTotal += size;
            return {
              price: parseFloat(b.price),
              size,
              total: bidTotal,
            };
          });
          
          const asks = (apiOrderbook.asks || []).slice(0, 15).map((a: { price: string; size: string }) => {
            const size = parseFloat(a.size);
            askTotal += size;
            return {
              price: parseFloat(a.price),
              size,
              total: askTotal,
            };
          });
          
          const midPrice = bids.length && asks.length 
            ? (bids[0].price + asks[0].price) / 2 
            : data.market.price_yes;
          
          setOrderbook({
            market_id: id,
            bids,
            asks,
            spread: asks.length && bids.length ? asks[0].price - bids[0].price : 0,
            mid_price: midPrice,
          });
        }
        
        if (data.priceHistory && Array.isArray(data.priceHistory)) {
          const history = data.priceHistory.map((p: PriceHistoryPoint) => ({
            timestamp: new Date(p.t * 1000).toISOString(),
            price: p.p,
            volume: 0,
          }));
          setPriceHistory(history);
        }
      } catch (err) {
        setError('Failed to load market');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMarket();
  }, [id]);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const response = await fetch(`/api/price-events?marketId=${id}`);
        if (response.ok) {
          const data = await response.json();
          setAllMarketArticles(data.articles || []);
        }
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      }
    }
    fetchArticles();
  }, [id]);

  useEffect(() => {
    if (!keyboardShortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPriceEvent) {
          setSelectedPriceEvent(null);
        } else if (showAnalysisModal) {
          setShowAnalysisModal(false);
        } else {
          router.back();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcutsEnabled, router, showAnalysisModal, selectedPriceEvent]);

  const runAnalysis = useCallback(async () => {
    if (!market || !priceHistory.length) return;
    
    setAiLoading(true);
    setAiError(null);
    setShowCalculatingModal(true);
    
    try {
      const prices = priceHistory.map(p => p.price);
      const orderbookData = orderbook ? {
        bids: orderbook.bids.map(b => ({ price: b.price, size: b.size })),
        asks: orderbook.asks.map(a => ({ price: a.price, size: a.size }))
      } : { bids: [], asks: [] };
      
      const [response] = await Promise.all([
        fetch('/api/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceHistory: prices,
            orderbook: orderbookData,
            currentPrice: market.price_yes,
            volume24h: market.volume_24h || 0,
            liquidity: market.liquidity,
            spread: market.spread || 0,
            question: market.question,
            positionSize,
            avgPrice: avgPrice / 100,
            simulationCount: 500,
            timeHorizon: 30
          })
        }),
        new Promise(resolve => setTimeout(resolve, 3500))
      ]);
      
      if (!response.ok) throw new Error('Analysis failed');
      
      const result = await response.json();
      setAiAnalysis(result);
      setAnalysisMode(selectedAnalysisType);
      setShowCalculatingModal(false);
      setShowAnalysisModal(true);
    } catch (err) {
      setAiError('Failed to run analysis');
      console.error(err);
      setShowCalculatingModal(false);
    } finally {
      setAiLoading(false);
    }
  }, [market, priceHistory, orderbook, positionSize, avgPrice, selectedAnalysisType]);

  const handlePriceEventClick = useCallback((event: PriceEvent) => {
    setSelectedPriceEvent(event);
  }, []);

  const defaultOrderbook = useMemo(() => ({
    market_id: id,
    bids: [],
    asks: [],
    spread: 0,
    mid_price: market?.price_yes || 0.5,
  }), [id, market]);

  if (loading) {
    return (
      <div className="p-4 max-w-7xl mx-auto font-mono">
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-terminal-green animate-spin" />
          <span className="ml-3 text-terminal-green glow-text">Loading market data...</span>
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="p-4 max-w-7xl mx-auto font-mono">
        <div className="text-center py-20">
          <h1 className="text-lg font-bold mb-2 text-terminal-green glow-text">Market Not Found</h1>
          <p className="text-muted-foreground text-sm mb-4">The market you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/" className="text-terminal-green text-sm hover:glow-text transition-all">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const priceYes = market.price_yes * 100;
  const priceChange24h = market.one_day_price_change || 0;

  return (
    <div className="h-[calc(100vh-72px)] flex flex-col overflow-hidden font-mono bg-black">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-black">
        <div className="flex items-center gap-3">
          <span className={cn(
            "px-2 py-0.5 border text-[10px] uppercase font-mono",
            market.status === 'active' 
              ? "border-terminal-green text-terminal-green glow-text-subtle" 
              : "border-muted-foreground text-muted-foreground"
          )}>
            {market.status}
          </span>
          <span className="text-xs text-muted-foreground font-mono uppercase">
            Expires: {formatDate(market.end_date)}
          </span>
        </div>
        
          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <div className="text-muted-foreground uppercase text-[9px] font-mono">Best Bid</div>
              <div className="text-terminal-green text-xs font-mono">
                {market.best_bid ? (market.best_bid * 100).toFixed(1) : (priceYes - 0.5).toFixed(1)}¢
              </div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground uppercase text-[9px] font-mono">Best Ask</div>
              <div className="text-terminal-green text-xs font-mono">
                {market.best_ask ? (market.best_ask * 100).toFixed(1) : (priceYes + 0.5).toFixed(1)}¢
              </div>
            </div>
          <div className="text-right">
            <div className="text-muted-foreground uppercase text-[9px] font-mono">Spread</div>
            <div className="text-terminal-amber text-xs font-mono">
              {market.spread ? (market.spread * 100).toFixed(2) : '0.00'}¢
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-border bg-black">
        <h1 className="text-terminal-green text-base uppercase tracking-wide mb-1 font-mono glow-text line-clamp-2">
          {market.question}
        </h1>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-terminal-green font-mono glow-text">
            {priceYes.toFixed(1)}¢
          </span>
          <span className={cn(
            "text-sm font-mono",
            priceChange24h >= 0 ? "text-terminal-green glow-text-subtle" : "text-terminal-red"
          )}>
            {priceChange24h >= 0 ? '+' : ''}{(priceChange24h * 100).toFixed(2)}%
          </span>
          <span className="text-muted-foreground text-sm font-mono">24H</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        <div className="col-span-8 flex flex-col overflow-hidden border-r border-border">
          <div className="flex-1 p-3 overflow-y-auto scrollbar-terminal">
            {priceHistory.length > 0 ? (
              <PriceChart 
                data={priceHistory} 
                selection={chartSelection}
                onSelectionChange={setChartSelection}
                marketId={id}
                onEventClick={handlePriceEventClick}
              />
            ) : (
              <div className="h-[200px] flex items-center justify-center border border-border bg-black">
                <span className="text-muted-foreground text-sm font-mono">No price history available</span>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-mono">Market Stats</div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="border border-border p-2 bg-black">
                    <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">24H Volume</div>
                    <div className="text-base font-bold text-terminal-green font-mono">
                      {formatVolume(market.volume_24h || 0)}
                    </div>
                  </div>
                  <div className="border border-border p-2 bg-black">
                    <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">Total Volume</div>
                    <div className="text-base font-bold text-terminal-green font-mono">
                      {formatVolume(market.volume)}
                    </div>
                  </div>
                  <div className="border border-border p-2 bg-black">
                    <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">Liquidity</div>
                    <div className="text-base font-bold text-terminal-green font-mono">
                      {formatVolume(market.liquidity)}
                    </div>
                  </div>
                  <div className="border border-border p-2 bg-black">
                    <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">Status</div>
                    <div className={cn(
                      "text-base font-bold font-mono",
                      market.status === 'active' ? "text-terminal-green" : "text-muted-foreground"
                    )}>
                      {market.status.toUpperCase()}
                    </div>
                  </div>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border">
              <Orderbook data={orderbook || defaultOrderbook} />
            </div>

              {market.description && (
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-mono">Resolution Details</div>
                  <div className="border border-border p-2 text-xs text-muted-foreground font-mono bg-black">
                    <span className="text-terminal-green glow-text-subtle">&gt;</span> {market.description}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-4 flex flex-col overflow-hidden">
            <div className="border-b border-border flex">
              {[
                { id: 'trade', label: 'Trade', icon: TrendingUp },
                { id: 'payoff', label: 'Payoff', icon: BarChart3 },
                { id: 'timing', label: 'Timing', icon: Calculator },
                { id: 'hedge', label: 'Hedge', icon: Shield }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'trade' | 'payoff' | 'timing' | 'hedge')}
                  className={cn(
                    "flex-1 py-2 px-2 text-[10px] font-mono uppercase flex items-center justify-center gap-1 transition-all",
                    activeTab === tab.id
                      ? "bg-terminal-green/10 text-terminal-green border-b-2 border-terminal-green"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-terminal p-3">
              {activeTab === 'trade' && (
                <div className="space-y-3">
                  <div className="border border-border bg-black p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Brain className="w-3 h-3" />
                        AI Analysis
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <button
                        onClick={() => setSelectedAnalysisType('ai')}
                        className={cn(
                          "w-full p-2 border text-left transition-all",
                          selectedAnalysisType === 'ai'
                            ? "border-terminal-amber bg-terminal-amber/10"
                            : "border-border hover:border-terminal-amber/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3 h-3 text-terminal-amber" />
                          <span className="text-xs font-bold font-mono text-terminal-amber">Wood Wide AI</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setSelectedAnalysisType('math')}
                        className={cn(
                          "w-full p-2 border text-left transition-all",
                          selectedAnalysisType === 'math'
                            ? "border-cyan-500 bg-cyan-500/10"
                            : "border-border hover:border-cyan-500/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Calculator className="w-3 h-3 text-cyan-500" />
                          <span className="text-xs font-bold font-mono text-cyan-500">Math Prediction</span>
                        </div>
                      </button>
                    </div>
                    
                    {aiError && (
                      <div className="text-terminal-red text-[9px] mb-2 font-mono">{aiError}</div>
                    )}
                    
                    <button 
                      onClick={runAnalysis}
                      disabled={aiLoading || !priceHistory.length}
                      className={cn(
                        "w-full py-2 font-bold uppercase text-xs font-mono transition-all",
                        aiLoading 
                          ? "bg-terminal-amber/20 border border-terminal-amber text-terminal-amber animate-pulse"
                          : selectedAnalysisType === 'ai'
                            ? "bg-terminal-amber hover:bg-terminal-amber/80 text-black"
                            : "bg-cyan-600 hover:bg-cyan-500 text-white"
                      )}
                    >
                      {aiLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Analyzing...
                        </span>
                      ) : (
                        `Run ${selectedAnalysisType === 'ai' ? 'AI' : 'Math'} Analysis`
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                      Position Builder
                    </span>
                    <Link
                      href="/portfolio"
                      className="flex items-center gap-1 text-[9px] text-terminal-green hover:glow-text-subtle transition-all"
                    >
                      <Briefcase className="w-3 h-3" />
                      View Portfolio ({positions.length})
                    </Link>
                  </div>
                  
                  <PositionBuilder
                    marketId={id}
                    marketQuestion={market.question}
                    currentPrice={market.price_yes}
                    outcomeYes={market.outcome_yes}
                    outcomeNo={market.outcome_no}
                  />
                  
                  <NewsTicker query={market.question} />
                </div>
              )}

              {activeTab === 'payoff' && (
                <div className="space-y-3">
                  <PayoffCurve
                    positions={marketPositions}
                    currentPrice={market.price_yes}
                    showTimeline
                    daysToExpiry={daysToExpiry}
                  />
                  
                  {marketPositions.length === 0 && (
                    <div className="text-center py-6 border border-border bg-black/50">
                      <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground mb-2">No positions in this market</p>
                      <button
                        onClick={() => setActiveTab('trade')}
                        className="text-xs text-terminal-green hover:glow-text-subtle"
                      >
                        Add a position to see payoff curve
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'timing' && (
                <TimeDecayVisualizer
                  positions={marketPositions}
                  currentPrice={market.price_yes}
                  daysToExpiry={daysToExpiry}
                />
              )}

              {activeTab === 'hedge' && (
                <ExternalHedgePanel
                  marketQuestion={market.question}
                  positions={marketPositions}
                />
              )}
            </div>
          </div>
        </div>

      {showCalculatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className={cn(
            "bg-black border w-full max-w-md mx-4 p-8 flex flex-col items-center",
            selectedAnalysisType === 'ai' ? "border-terminal-amber" : "border-cyan-500"
          )}>
            <div className="relative w-24 h-24 mb-6">
              <div className={cn(
                "absolute inset-0 rounded-full border-4 border-t-transparent animate-spin",
                selectedAnalysisType === 'ai' ? "border-terminal-amber" : "border-cyan-500"
              )} style={{ animationDuration: '1s' }} />
              <div className={cn(
                "absolute inset-2 rounded-full border-4 border-b-transparent animate-spin",
                selectedAnalysisType === 'ai' ? "border-terminal-amber/50" : "border-cyan-500/50"
              )} style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
              <div className={cn(
                "absolute inset-4 rounded-full border-4 border-t-transparent animate-spin",
                selectedAnalysisType === 'ai' ? "border-terminal-amber/30" : "border-cyan-500/30"
              )} style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                {selectedAnalysisType === 'ai' ? (
                  <Brain className="w-8 h-8 text-terminal-amber animate-pulse" />
                ) : (
                  <Calculator className="w-8 h-8 text-cyan-500 animate-pulse" />
                )}
              </div>
            </div>
            
            <h3 className={cn(
              "text-lg font-bold font-mono uppercase mb-2",
              selectedAnalysisType === 'ai' ? "text-terminal-amber" : "text-cyan-500"
            )}>
              {selectedAnalysisType === 'ai' ? 'Running AI Analysis' : 'Running Simulations'}
            </h3>
            
            <div className="space-y-2 text-center mb-4">
              <p className="text-sm text-muted-foreground font-mono animate-pulse">
                {selectedAnalysisType === 'ai' 
                  ? 'Processing market data through neural network...'
                  : 'Running 500 Monte Carlo simulations...'}
              </p>
            </div>
            
            <div className="w-full space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  selectedAnalysisType === 'ai' ? "bg-terminal-amber" : "bg-cyan-500"
                )} />
                <span className="animate-pulse">Analyzing price history...</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  selectedAnalysisType === 'ai' ? "bg-terminal-amber" : "bg-cyan-500"
                )} style={{ animationDelay: '0.2s' }} />
                <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>Evaluating orderbook depth...</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  selectedAnalysisType === 'ai' ? "bg-terminal-amber" : "bg-cyan-500"
                )} style={{ animationDelay: '0.4s' }} />
                <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>Compressing tokens via The Token Company...</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  selectedAnalysisType === 'ai' ? "bg-terminal-amber" : "bg-cyan-500"
                )} style={{ animationDelay: '0.6s' }} />
                <span className="animate-pulse" style={{ animationDelay: '0.6s' }}>
                  {selectedAnalysisType === 'ai' ? 'Generating prediction...' : 'Computing risk scenarios...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedPriceEvent && (
        <PriceEventModal
          event={selectedPriceEvent}
          onClose={() => setSelectedPriceEvent(null)}
          allArticles={allMarketArticles}
        />
      )}

      {showAnalysisModal && aiAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className={cn(
            "bg-black border w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden flex flex-col",
            analysisMode === 'ai' ? "border-terminal-amber" : "border-cyan-500"
          )}>
            <div className={cn(
              "sticky top-0 bg-black border-b p-3 flex items-center justify-between",
              analysisMode === 'ai' ? "border-terminal-amber" : "border-cyan-500"
            )}>
              <div className="flex items-center gap-2">
                {analysisMode === 'ai' ? (
                  <>
                    <Sparkles className="w-4 h-4 text-terminal-amber" />
                    <span className="text-terminal-amber font-mono text-sm uppercase">Wood Wide AI Analysis</span>
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 text-cyan-500" />
                    <span className="text-cyan-500 font-mono text-sm uppercase">Math Prediction</span>
                    <span className="text-[9px] text-muted-foreground font-mono ml-2">
                      {aiAnalysis.monteCarlo.simulationCount} simulations
                    </span>
                  </>
                )}
              </div>
              <button 
                onClick={() => setShowAnalysisModal(false)}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {analysisMode === 'ai' ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="border border-border p-4 bg-black/50">
                  <div className="text-[9px] text-muted-foreground uppercase mb-3 font-mono">AI Prediction</div>
                  <div className="flex items-center gap-4">
                    {aiAnalysis.prediction.direction === 'YES' ? (
                      <div className="w-16 h-16 rounded-full bg-terminal-green/20 flex items-center justify-center">
                        <TrendingUp className="w-8 h-8 text-terminal-green" />
                      </div>
                    ) : aiAnalysis.prediction.direction === 'NO' ? (
                      <div className="w-16 h-16 rounded-full bg-terminal-red/20 flex items-center justify-center">
                        <TrendingDown className="w-8 h-8 text-terminal-red" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-terminal-amber/20 flex items-center justify-center">
                        <Minus className="w-8 h-8 text-terminal-amber" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className={cn(
                        "text-3xl font-bold font-mono",
                        aiAnalysis.prediction.direction === 'YES' ? "text-terminal-green glow-text" :
                        aiAnalysis.prediction.direction === 'NO' ? "text-terminal-red" :
                        "text-terminal-amber"
                      )}>
                        {aiAnalysis.prediction.direction}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono mt-1">
                        {(aiAnalysis.prediction.probability * 100).toFixed(1)}% predicted probability
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-muted-foreground uppercase font-mono">Confidence</div>
                      <div className="text-2xl font-bold font-mono text-terminal-amber">
                        {(aiAnalysis.prediction.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-border p-4 bg-black/50">
                  <div className="text-[9px] text-muted-foreground uppercase mb-2 font-mono">Analysis Reasoning</div>
                  <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                    {aiAnalysis.analysis.reasoning}
                  </p>
                </div>

                <div className="border border-border p-4 bg-black/50">
                  <div className="text-[9px] text-muted-foreground uppercase mb-3 font-mono">Technical Signals</div>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.analysis.signals.map((signal, i) => (
                      <span 
                        key={i}
                        className="px-2 py-1 text-[10px] font-mono border border-terminal-amber/50 text-terminal-amber bg-terminal-amber/5"
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-border p-3 bg-black/50">
                    <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">Momentum</div>
                    <div className={cn(
                      "text-lg font-bold font-mono",
                      aiAnalysis.analysis.metrics.momentum >= 0 ? "text-terminal-green" : "text-terminal-red"
                    )}>
                      {aiAnalysis.analysis.metrics.momentum >= 0 ? '+' : ''}{aiAnalysis.analysis.metrics.momentum.toFixed(2)}%
                    </div>
                  </div>
                  <div className="border border-border p-3 bg-black/50">
                    <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">Volatility</div>
                    <div className="text-lg font-bold font-mono text-terminal-amber">
                      {aiAnalysis.analysis.metrics.volatility.toFixed(2)}%
                    </div>
                  </div>
                  <div className="border border-border p-3 bg-black/50">
                    <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">RSI</div>
                    <div className={cn(
                      "text-lg font-bold font-mono",
                      aiAnalysis.analysis.metrics.rsi > 70 ? "text-terminal-red" :
                      aiAnalysis.analysis.metrics.rsi < 30 ? "text-terminal-green" :
                      "text-muted-foreground"
                    )}>
                      {aiAnalysis.analysis.metrics.rsi.toFixed(0)}
                    </div>
                  </div>
                    <div className="border border-border p-3 bg-black/50">
                      <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">Order Imbalance</div>
                      <div className={cn(
                        "text-lg font-bold font-mono",
                        aiAnalysis.analysis.metrics.orderImbalance > 0 ? "text-terminal-green" : 
                        aiAnalysis.analysis.metrics.orderImbalance < 0 ? "text-terminal-red" :
                        "text-muted-foreground"
                      )}>
                        {aiAnalysis.analysis.metrics.orderImbalance >= 0 ? '+' : ''}{aiAnalysis.analysis.metrics.orderImbalance.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {aiAnalysis.compression && (
                    <div className="border border-purple-500/50 p-4 bg-purple-500/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span className="text-[10px] text-purple-400 uppercase font-mono font-bold">Token Compression</span>
                        <span className="text-[9px] text-muted-foreground font-mono ml-auto">powered by The Token Company</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">Original</div>
                          <div className="text-lg font-bold font-mono text-muted-foreground">
                            {aiAnalysis.compression.originalTokens}
                          </div>
                          <div className="text-[9px] text-muted-foreground font-mono">tokens</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">Compressed</div>
                          <div className="text-lg font-bold font-mono text-purple-400">
                            {aiAnalysis.compression.compressedTokens}
                          </div>
                          <div className="text-[9px] text-muted-foreground font-mono">tokens</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">Saved</div>
                          <div className="text-lg font-bold font-mono text-terminal-green">
                            {aiAnalysis.compression.compressionRatio.toFixed(0)}%
                          </div>
                          <div className="text-[9px] text-muted-foreground font-mono">reduction</div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-purple-500/30">
                        <div className="text-[9px] text-muted-foreground font-mono">
                          LLM costs reduced by ~{aiAnalysis.compression.compressionRatio.toFixed(0)}% while maintaining accuracy
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <>
                <div className="flex border-b border-border">
                  <button
                    onClick={() => setMathTab('montecarlo')}
                    className={cn(
                      "flex-1 py-2 px-4 text-xs font-mono uppercase flex items-center justify-center gap-2 transition-all",
                      mathTab === 'montecarlo' 
                        ? "bg-cyan-500/10 text-cyan-500 border-b-2 border-cyan-500" 
                        : "text-muted-foreground hover:text-cyan-500"
                    )}
                  >
                    <Shuffle className="w-3 h-3" />
                    Monte Carlo
                  </button>
                  <button
                    onClick={() => setMathTab('scenario')}
                    className={cn(
                      "flex-1 py-2 px-4 text-xs font-mono uppercase flex items-center justify-center gap-2 transition-all",
                      mathTab === 'scenario' 
                        ? "bg-cyan-500/10 text-cyan-500 border-b-2 border-cyan-500" 
                        : "text-muted-foreground hover:text-cyan-500"
                    )}
                  >
                    <BarChart3 className="w-3 h-3" />
                    Scenario
                  </button>
                  <button
                    onClick={() => setMathTab('hedge')}
                    className={cn(
                      "flex-1 py-2 px-4 text-xs font-mono uppercase flex items-center justify-center gap-2 transition-all",
                      mathTab === 'hedge' 
                        ? "bg-cyan-500/10 text-cyan-500 border-b-2 border-cyan-500" 
                        : "text-muted-foreground hover:text-cyan-500"
                    )}
                  >
                    <Shield className="w-3 h-3" />
                    Hedge
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {mathTab === 'montecarlo' && (
                    <div className="space-y-4">
                      <div className="border border-border p-3 bg-black/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[9px] text-muted-foreground uppercase font-mono">
                            Simulation Paths ({aiAnalysis.monteCarlo.simulationCount} runs)
                          </div>
                          <div className="flex gap-3 text-[8px] font-mono">
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-0.5 bg-[#3b82f6]"></span>
                              Best
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-0.5 bg-[#f59e0b]"></span>
                              Median
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-0.5 bg-[#ef4444]"></span>
                              Worst
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-0.5 bg-[#22c55e]"></span>
                              Historical
                            </span>
                          </div>
                        </div>
                        <SimulationChart 
                          historicalPrices={aiAnalysis.historicalPrices}
                          monteCarlo={aiAnalysis.monteCarlo}
                          currentPrice={market.price_yes}
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2">
                        <div className="border border-border p-2 bg-black/50">
                          <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">Mean</div>
                          <div className="text-sm font-bold font-mono text-cyan-400">
                            {(aiAnalysis.monteCarlo.statistics.mean * 100).toFixed(1)}¢
                          </div>
                        </div>
                        <div className="border border-border p-2 bg-black/50">
                          <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">Median</div>
                          <div className="text-sm font-bold font-mono text-terminal-amber">
                            {(aiAnalysis.monteCarlo.statistics.median * 100).toFixed(1)}¢
                          </div>
                        </div>
                        <div className="border border-border p-2 bg-black/50">
                          <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">Std Dev</div>
                          <div className="text-sm font-bold font-mono text-muted-foreground">
                            {(aiAnalysis.monteCarlo.statistics.stdDev * 100).toFixed(2)}¢
                          </div>
                        </div>
                        <div className="border border-border p-2 bg-black/50">
                          <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">P(Up)</div>
                          <div className={cn(
                            "text-sm font-bold font-mono",
                            aiAnalysis.monteCarlo.statistics.probUp > 0.5 ? "text-terminal-green" : "text-terminal-red"
                          )}>
                            {(aiAnalysis.monteCarlo.statistics.probUp * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="border border-border p-3 bg-black/50">
                        <div className="text-[9px] text-muted-foreground uppercase mb-2 font-mono">Distribution Summary</div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-muted-foreground">5th Percentile (Bear)</span>
                            <span className="text-terminal-red">{(aiAnalysis.monteCarlo.statistics.percentile5 * 100).toFixed(1)}¢</span>
                          </div>
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-muted-foreground">25th Percentile</span>
                            <span className="text-terminal-amber">{(aiAnalysis.monteCarlo.statistics.percentile25 * 100).toFixed(1)}¢</span>
                          </div>
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-muted-foreground">75th Percentile</span>
                            <span className="text-terminal-amber">{(aiAnalysis.monteCarlo.statistics.percentile75 * 100).toFixed(1)}¢</span>
                          </div>
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-muted-foreground">95th Percentile (Bull)</span>
                            <span className="text-terminal-green">{(aiAnalysis.monteCarlo.statistics.percentile95 * 100).toFixed(1)}¢</span>
                          </div>
                          <div className="border-t border-border pt-2 mt-2 flex justify-between text-xs font-mono">
                            <span className="text-muted-foreground">Range</span>
                            <span className="text-cyan-400">
                              {(aiAnalysis.monteCarlo.statistics.min * 100).toFixed(1)}¢ - {(aiAnalysis.monteCarlo.statistics.max * 100).toFixed(1)}¢
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {mathTab === 'scenario' && (
                    <div className="space-y-4">
                      <div className="border border-border p-3 bg-black/50">
                        <div className="text-[9px] text-muted-foreground uppercase mb-2 font-mono">P&L Across Price Shocks</div>
                        <ScenarioChart scenarios={aiAnalysis.scenarios} />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {aiAnalysis.scenarios.filter((_, i) => i % 2 === 0).slice(0, 3).map((s, i) => (
                          <div key={i} className="border border-border p-2 bg-black/50">
                            <div className="text-[9px] text-muted-foreground uppercase mb-1 font-mono">
                              {s.priceShock >= 0 ? '+' : ''}{(s.priceShock * 100).toFixed(0)}¢ Shock
                            </div>
                            <div className={cn(
                              "text-sm font-bold font-mono",
                              s.isProfit ? "text-terminal-green" : "text-terminal-red"
                            )}>
                              {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}
                            </div>
                            <div className="text-[9px] text-muted-foreground font-mono">
                              {s.pnlPercent >= 0 ? '+' : ''}{s.pnlPercent.toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border border-border p-3 bg-black/50">
                        <div className="text-[9px] text-muted-foreground uppercase mb-2 font-mono">All Scenarios</div>
                        <div className="space-y-1">
                          {aiAnalysis.scenarios.map((s, i) => (
                            <div key={i} className="flex justify-between text-xs font-mono">
                              <span className="text-muted-foreground">
                                Price @ {(s.newPrice * 100).toFixed(1)}¢
                              </span>
                              <span className={s.isProfit ? "text-terminal-green" : "text-terminal-red"}>
                                {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {mathTab === 'hedge' && (
                    <div className="space-y-4">
                      <div className="border border-border p-3 bg-black/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[9px] text-muted-foreground uppercase font-mono">Recommended Strategy</div>
                          <span className="text-[9px] text-cyan-400 border border-cyan-500/50 px-2 py-0.5 font-mono">
                            {aiAnalysis.hedge.recommendedStrategy}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          Unhedged Risk: <span className="text-terminal-red">${aiAnalysis.hedge.unhedgedRisk.toFixed(2)}</span>
                          <span className="mx-2">•</span>
                          Optimal Hedge Ratio: <span className="text-terminal-amber">{(aiAnalysis.hedge.optimalHedgeRatio * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {aiAnalysis.hedge.strategies.map((strategy, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "border p-3 bg-black/50",
                              strategy.name === aiAnalysis.hedge.recommendedStrategy 
                                ? "border-cyan-500" 
                                : "border-border"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-bold font-mono text-cyan-400">{strategy.name}</span>
                              <span className="text-[9px] text-terminal-amber font-mono">
                                -{strategy.riskReduction}% risk
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono mb-2">{strategy.description}</p>
                            <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
                              <div>
                                <span className="text-muted-foreground">Hedge Size: </span>
                                <span className="text-cyan-400">{strategy.hedgeSize.toFixed(0)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Cost: </span>
                                <span className="text-terminal-amber">${strategy.hedgeCost.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Max Loss: </span>
                                <span className="text-terminal-red">${strategy.maxLoss.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border border-border p-3 bg-black/50">
                        <div className="text-[9px] text-muted-foreground uppercase mb-2 font-mono">Correlated Markets</div>
                        <div className="space-y-1">
                          {aiAnalysis.hedge.correlatedMarkets.map((m, i) => (
                            <div key={i} className="flex justify-between text-xs font-mono">
                              <span className="text-muted-foreground">{m.name}</span>
                              <span>
                                <span className={m.correlation > 0 ? "text-terminal-green" : "text-terminal-red"}>
                                  {m.correlation > 0 ? '+' : ''}{(m.correlation * 100).toFixed(0)}% corr
                                </span>
                                <span className="text-muted-foreground ml-2">
                                  ({(m.hedgeRatio * 100).toFixed(0)}% hedge)
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            
            <div className="border-t border-border p-3 bg-black">
              <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
                <span>Model: {analysisMode === 'ai' ? 'WoodWide-NumericReasoning-v1' : 'Monte Carlo GBM'}</span>
                <span>{new Date(aiAnalysis.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
