'use client';

import { useState } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Loader2,
  Sparkles,
  AlertTriangle,
  Shield,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTerminalStore } from '@/lib/store';
import { 
  generateMockAnalysis, 
  generateMockScenario, 
  generateMockMonteCarlo, 
  generateMockHedge 
} from '@/lib/mock-data';
import { FanChart } from '@/components/charts/fan-chart';
import { Slider } from '@/components/ui/slider';
import type { 
  AnalysisResult, 
  ScenarioResult, 
  MonteCarloResult, 
  HedgeResult 
} from '@/lib/types';

interface AnalysisPanelProps {
  marketId: string;
  className?: string;
}

export function AnalysisPanel({ marketId, className }: AnalysisPanelProps) {
  const { 
    activePanel, 
    setActivePanel,
    shockPct,
    setShockPct,
    positionSize,
    setPositionSize,
    analysisLoading,
    setAnalysisLoading,
  } = useTerminalStore();

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [scenario, setScenario] = useState<ScenarioResult | null>(null);
  const [monteCarlo, setMonteCarlo] = useState<MonteCarloResult | null>(null);
  const [hedge, setHedge] = useState<HedgeResult | null>(null);

  const runAnalysis = async () => {
    setAnalysisLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setAnalysis(generateMockAnalysis(marketId));
    setAnalysisLoading(false);
  };

  const runScenario = async () => {
    setAnalysisLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setScenario(generateMockScenario(marketId, shockPct));
    setAnalysisLoading(false);
  };

  const runMonteCarlo = async () => {
    setAnalysisLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setMonteCarlo(generateMockMonteCarlo(marketId));
    setAnalysisLoading(false);
  };

  const runHedge = async () => {
    setAnalysisLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setHedge(generateMockHedge(marketId));
    setAnalysisLoading(false);
  };

  const tabs = [
    { id: 'analysis' as const, label: 'Analysis', icon: Brain },
    { id: 'scenario' as const, label: 'Scenario', icon: Target },
    { id: 'montecarlo' as const, label: 'Monte Carlo', icon: Sparkles },
    { id: 'hedge' as const, label: 'Hedge', icon: Shield },
  ];

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="w-3.5 h-3.5 text-terminal-green" />;
      case 'negative': return <TrendingDown className="w-3.5 h-3.5 text-terminal-red" />;
      default: return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn("flex flex-col h-full font-mono", className)}>
      <div className="flex items-center gap-1 p-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
              activePanel === tab.id
                ? "text-terminal-green border-b-2 border-terminal-green"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-terminal p-4">
        {activePanel === 'analysis' && (
          <div className="space-y-4">
            <button
              onClick={runAnalysis}
              disabled={analysisLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-terminal-green text-terminal-green hover:bg-terminal-green/10 transition-colors disabled:opacity-50 font-medium uppercase text-sm"
            >
              {analysisLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  [Run AI Analysis]
                </>
              )}
            </button>

            {analysis && (
              <>
                <div className="border border-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Sentiment</span>
                    <span className={cn(
                      "px-2 py-0.5 text-xs font-medium uppercase",
                      analysis.sentiment.overall === 'bullish' && "text-terminal-green border border-terminal-green",
                      analysis.sentiment.overall === 'bearish' && "text-terminal-red border border-terminal-red",
                      analysis.sentiment.overall === 'neutral' && "text-muted-foreground border border-border"
                    )}>
                      {analysis.sentiment.overall}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 border border-border">
                      <div className="text-muted-foreground mb-1">Overall</div>
                      <div className="font-bold text-terminal-green">{(analysis.sentiment.score * 100).toFixed(0)}%</div>
                    </div>
                    <div className="text-center p-2 border border-border">
                      <div className="text-muted-foreground mb-1">Reddit</div>
                      <div className="font-bold text-terminal-green">{(analysis.sentiment.reddit_sentiment * 100).toFixed(0)}%</div>
                    </div>
                    <div className="text-center p-2 border border-border">
                      <div className="text-muted-foreground mb-1">News</div>
                      <div className="font-bold text-terminal-green">{(analysis.sentiment.news_sentiment * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium mb-2 text-muted-foreground uppercase">Key Drivers</h4>
                  <div className="space-y-2">
                    {analysis.drivers.map((driver, i) => (
                      <div key={i} className="border border-border p-3">
                        <div className="flex items-center gap-2 mb-1">
                          {getImpactIcon(driver.impact)}
                          <span className="text-sm font-medium text-terminal-green">{driver.factor}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            {(driver.confidence * 100).toFixed(0)}% conf
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{driver.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium mb-2 text-muted-foreground uppercase">Summary</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed border border-border p-3">
                    <span className="text-terminal-green">&gt;</span> {analysis.summary}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-medium mb-2 text-muted-foreground uppercase">Sources</h4>
                  <div className="space-y-2">
                    {analysis.citations.map((citation, i) => (
                      <a
                        key={i}
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border border-border p-3 hover:border-terminal-green/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-terminal-green">{citation.source}</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <div className="text-sm mb-1 text-foreground">{citation.title}</div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{citation.snippet}</p>
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activePanel === 'scenario' && (
          <div className="space-y-4">
            <div className="border border-border p-4">
              <label className="text-xs font-medium mb-3 block text-muted-foreground uppercase">
                Price Shock: <span className={cn(
                  shockPct >= 0 ? "text-terminal-green" : "text-terminal-red"
                )}>{shockPct >= 0 ? '+' : ''}{shockPct}%</span>
              </label>
              <Slider
                value={[shockPct]}
                onValueChange={([v]) => setShockPct(v)}
                min={-50}
                max={50}
                step={1}
                className="mb-4"
              />

              <label className="text-xs font-medium mb-3 block text-muted-foreground uppercase">
                Position Size: <span className="text-terminal-green">${positionSize}</span>
              </label>
              <Slider
                value={[positionSize]}
                onValueChange={([v]) => setPositionSize(v)}
                min={10}
                max={10000}
                step={10}
              />
            </div>

            <button
              onClick={runScenario}
              disabled={analysisLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-terminal-amber text-terminal-amber hover:bg-terminal-amber/10 transition-colors disabled:opacity-50 font-medium uppercase text-sm"
            >
              {analysisLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  [Simulate Impact]
                </>
              )}
            </button>

            {scenario && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-border p-3 text-center">
                    <div className="text-[10px] text-muted-foreground uppercase mb-1">Current Price</div>
                    <div className="text-xl font-bold text-terminal-green">{(scenario.current_price * 100).toFixed(1)}¢</div>
                  </div>
                  <div className="border border-border p-3 text-center">
                    <div className="text-[10px] text-muted-foreground uppercase mb-1">Projected Price</div>
                    <div className={cn(
                      "text-xl font-bold",
                      scenario.projected_price > scenario.current_price ? "text-terminal-green" : "text-terminal-red"
                    )}>
                      {(scenario.projected_price * 100).toFixed(1)}¢
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "border p-4 text-center",
                  scenario.pnl >= 0 ? "border-terminal-green" : "border-terminal-red"
                )}>
                  <div className="text-xs text-muted-foreground mb-1 uppercase">Projected P&L</div>
                  <div className={cn(
                    "text-3xl font-bold",
                    scenario.pnl >= 0 ? "text-terminal-green" : "text-terminal-red"
                  )}>
                    {scenario.pnl >= 0 ? '+' : ''}{scenario.pnl.toFixed(2)}
                  </div>
                  <div className={cn(
                    "text-sm",
                    scenario.pnl_pct >= 0 ? "text-terminal-green" : "text-terminal-red"
                  )}>
                    ({scenario.pnl_pct >= 0 ? '+' : ''}{scenario.pnl_pct.toFixed(1)}%)
                  </div>
                </div>

                <div className="border border-terminal-red p-3 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-terminal-red flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-terminal-red uppercase">Max Loss at Shock</div>
                    <div className="text-lg font-bold text-terminal-red">
                      ${Math.abs(scenario.max_loss).toFixed(2)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activePanel === 'montecarlo' && (
          <div className="space-y-4">
            <button
              onClick={runMonteCarlo}
              disabled={analysisLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-terminal-green text-terminal-green hover:bg-terminal-green/10 transition-colors disabled:opacity-50 font-medium uppercase text-sm"
            >
              {analysisLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running Simulations...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  [Run Monte Carlo]
                </>
              )}
            </button>

            {monteCarlo && (
              <>
                <FanChart data={monteCarlo} />

                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-border p-3 text-center">
                    <div className="text-[10px] text-muted-foreground uppercase mb-1">Expected Value</div>
                    <div className="text-lg font-bold text-terminal-green">
                      {(monteCarlo.expected_value * 100).toFixed(1)}¢
                    </div>
                  </div>
                  <div className="border border-border p-3 text-center">
                    <div className="text-[10px] text-muted-foreground uppercase mb-1">Volatility</div>
                    <div className="text-lg font-bold text-terminal-amber">
                      {(monteCarlo.volatility * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="border border-border p-3 text-center">
                    <div className="text-[10px] text-muted-foreground uppercase mb-1">VaR (95%)</div>
                    <div className="text-lg font-bold text-terminal-red">
                      {(monteCarlo.var_95 * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activePanel === 'hedge' && (
          <div className="space-y-4">
            <div className="border border-border p-4">
              <label className="text-xs font-medium mb-3 block text-muted-foreground uppercase">
                Position to Hedge: <span className="text-terminal-green">${positionSize}</span>
              </label>
              <Slider
                value={[positionSize]}
                onValueChange={([v]) => setPositionSize(v)}
                min={10}
                max={10000}
                step={10}
              />
            </div>

            <button
              onClick={runHedge}
              disabled={analysisLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-terminal-green text-terminal-green hover:bg-terminal-green/10 transition-colors disabled:opacity-50 font-medium uppercase text-sm"
            >
              {analysisLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding Hedges...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  [Find Hedge Opportunities]
                </>
              )}
            </button>

            {hedge && (
              <>
                <div className="border border-terminal-green p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Risk Reduction</span>
                    <span className="text-xl font-bold text-terminal-green">
                      {hedge.risk_reduction_pct}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Total Exposure:</span>
                      <span className="ml-2 text-foreground">${hedge.total_exposure}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hedged:</span>
                      <span className="ml-2 text-terminal-green">${hedge.hedged_exposure}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium mb-2 text-muted-foreground uppercase">Recommended Hedges</h4>
                  <div className="space-y-3">
                    {hedge.recommendations.map((rec, i) => (
                      <div key={i} className="border border-border p-3">
                        <div className="text-sm font-medium mb-2 text-terminal-green">{rec.market_question}</div>
                        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                          <div className="text-center p-2 border border-border">
                            <div className="text-muted-foreground mb-1">Correlation</div>
                            <div className={cn(
                              "font-bold",
                              rec.correlation < 0 ? "text-terminal-green" : "text-terminal-amber"
                            )}>
                              {rec.correlation.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-center p-2 border border-border">
                            <div className="text-muted-foreground mb-1">Size</div>
                            <div className="font-bold text-foreground">${rec.suggested_size}</div>
                          </div>
                          <div className="text-center p-2 border border-border">
                            <div className="text-muted-foreground mb-1">Hedge Ratio</div>
                            <div className="font-bold text-foreground">{(rec.hedge_ratio * 100).toFixed(0)}%</div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {rec.caveats.map((caveat, j) => (
                            <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <AlertTriangle className="w-3 h-3 text-terminal-amber flex-shrink-0 mt-0.5" />
                              <span>{caveat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
