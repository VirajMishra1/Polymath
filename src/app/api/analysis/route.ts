import { NextRequest, NextResponse } from 'next/server';

interface MarketData {
  priceHistory: number[];
  orderbook: {
    bids: { price: number; size: number }[];
    asks: { price: number; size: number }[];
  };
  currentPrice: number;
  volume24h: number;
  liquidity: number;
  spread: number;
  question: string;
  positionSize?: number;
  avgPrice?: number;
  simulationCount?: number;
  timeHorizon?: number;
}

function calculateFeatures(data: MarketData) {
  const prices = data.priceHistory;
  
  const sma5 = prices.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, prices.length);
  const sma10 = prices.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, prices.length);
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, prices.length);
  
  const momentum = prices.length > 1 ? (prices[prices.length - 1] - prices[0]) / prices[0] * 100 : 0;
  
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  const volatility = Math.sqrt(variance) * 100;
  
  let rsi = 50;
  if (prices.length > 1) {
    let gains = 0, losses = 0, count = 0;
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
      count++;
    }
    const avgGain = gains / count;
    const avgLoss = losses / count;
    if (avgLoss > 0) {
      const rs = avgGain / avgLoss;
      rsi = 100 - (100 / (1 + rs));
    }
  }
  
  const bidDepth = data.orderbook.bids.reduce((sum, b) => sum + b.size, 0);
  const askDepth = data.orderbook.asks.reduce((sum, a) => sum + a.size, 0);
  const orderImbalance = bidDepth > 0 || askDepth > 0 
    ? (bidDepth - askDepth) / (bidDepth + askDepth) * 100 
    : 0;
  
  const bestBid = data.orderbook.bids[0]?.price || data.currentPrice - 0.01;
  const bestAsk = data.orderbook.asks[0]?.price || data.currentPrice + 0.01;
  const spreadPercent = ((bestAsk - bestBid) / data.currentPrice) * 100;
  
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const returnVariance = returns.length > 0 
    ? returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length 
    : 0.01;
  const dailyVolatility = Math.sqrt(returnVariance);
  
  return {
    currentPrice: data.currentPrice,
    sma5,
    sma10,
    sma20,
    momentum,
    volatility,
    dailyVolatility,
    meanReturn,
    rsi,
    orderImbalance,
    bidDepth,
    askDepth,
    spreadPercent,
    volume24h: data.volume24h,
    liquidity: data.liquidity,
    priceAboveSMA5: data.currentPrice > sma5,
    priceAboveSMA10: data.currentPrice > sma10,
    priceAboveSMA20: data.currentPrice > sma20,
    trend: sma5 > sma10 ? 'bullish' : sma5 < sma10 ? 'bearish' : 'neutral'
  };
}

function boxMullerRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function runMonteCarloSimulation(
  currentPrice: number,
  drift: number,
  volatility: number,
  timeSteps: number,
  numSimulations: number
) {
  const dt = 1 / timeSteps;
  const allPaths: number[][] = [];
  const finalPrices: number[] = [];
  
  for (let sim = 0; sim < numSimulations; sim++) {
    const path: number[] = [currentPrice];
    let price = currentPrice;
    
    for (let t = 0; t < timeSteps; t++) {
      const randomShock = boxMullerRandom();
      const driftTerm = drift * dt;
      const diffusionTerm = volatility * Math.sqrt(dt) * randomShock;
      price = Math.max(0.01, Math.min(0.99, price * (1 + driftTerm + diffusionTerm)));
      path.push(price);
    }
    
    allPaths.push(path);
    finalPrices.push(price);
  }
  
  finalPrices.sort((a, b) => a - b);
  
  const percentile = (arr: number[], p: number) => {
    const idx = Math.floor(arr.length * p);
    return arr[Math.min(idx, arr.length - 1)];
  };
  
  const meanFinal = finalPrices.reduce((a, b) => a + b, 0) / finalPrices.length;
  const stdDev = Math.sqrt(
    finalPrices.reduce((sum, p) => sum + Math.pow(p - meanFinal, 2), 0) / finalPrices.length
  );
  
  const bestPathIdx = allPaths.reduce((best, path, idx) => 
    path[path.length - 1] > allPaths[best][allPaths[best].length - 1] ? idx : best, 0);
  const worstPathIdx = allPaths.reduce((worst, path, idx) => 
    path[path.length - 1] < allPaths[worst][allPaths[worst].length - 1] ? idx : worst, 0);
  
  const medianPaths = allPaths
    .map((path, idx) => ({ path, final: path[path.length - 1], idx }))
    .sort((a, b) => a.final - b.final);
  const medianPathIdx = Math.floor(medianPaths.length / 2);
  
  const sampleIndices = [
    Math.floor(numSimulations * 0.1),
    Math.floor(numSimulations * 0.25),
    Math.floor(numSimulations * 0.5),
    Math.floor(numSimulations * 0.75),
    Math.floor(numSimulations * 0.9)
  ];
  const samplePaths = sampleIndices.map(idx => medianPaths[idx]?.path || allPaths[0]);
  
  return {
    simulationCount: numSimulations,
    timeSteps,
    statistics: {
      mean: meanFinal,
      median: percentile(finalPrices, 0.5),
      stdDev,
      percentile5: percentile(finalPrices, 0.05),
      percentile25: percentile(finalPrices, 0.25),
      percentile75: percentile(finalPrices, 0.75),
      percentile95: percentile(finalPrices, 0.95),
      min: finalPrices[0],
      max: finalPrices[finalPrices.length - 1],
      probUp: finalPrices.filter(p => p > currentPrice).length / numSimulations,
      probDown: finalPrices.filter(p => p < currentPrice).length / numSimulations
    },
    paths: {
      best: allPaths[bestPathIdx],
      worst: allPaths[worstPathIdx],
      median: medianPaths[medianPathIdx].path,
      samples: samplePaths
    }
  };
}

function calculateScenarioAnalysis(
  currentPrice: number,
  positionSize: number,
  avgPrice: number
) {
  const scenarios = [-0.30, -0.20, -0.10, -0.05, 0, 0.05, 0.10, 0.20, 0.30];
  
  return scenarios.map(shock => {
    const newPrice = Math.max(0.01, Math.min(0.99, currentPrice + shock));
    const pnl = positionSize * (newPrice - avgPrice);
    const pnlPercent = ((newPrice - avgPrice) / avgPrice) * 100;
    
    return {
      priceShock: shock,
      newPrice,
      pnl,
      pnlPercent,
      isProfit: pnl > 0
    };
  });
}

function calculateHedgeAnalysis(
  currentPrice: number,
  positionSize: number,
  volatility: number
) {
  const hedgeStrategies = [
    {
      name: 'Delta Hedge',
      description: 'Take opposing position to neutralize directional risk',
      hedgeSize: -positionSize * 0.5,
      hedgeCost: Math.abs(positionSize * 0.5 * currentPrice * 0.02),
      riskReduction: 50,
      maxLoss: Math.abs(positionSize * currentPrice * 0.25)
    },
    {
      name: 'Collar Strategy',
      description: 'Limit both upside and downside with spread positions',
      hedgeSize: -positionSize * 0.3,
      hedgeCost: Math.abs(positionSize * currentPrice * 0.03),
      riskReduction: 35,
      maxLoss: Math.abs(positionSize * currentPrice * 0.15)
    },
    {
      name: 'Volatility Hedge',
      description: 'Position for volatility regardless of direction',
      hedgeSize: positionSize * (volatility > 10 ? 0.4 : 0.2),
      hedgeCost: Math.abs(positionSize * currentPrice * 0.04),
      riskReduction: 25,
      maxLoss: Math.abs(positionSize * currentPrice * 0.35)
    }
  ];
  
  return {
    strategies: hedgeStrategies,
    correlatedMarkets: [],
    optimalHedgeRatio: 0.5 + (volatility / 100),
    unhedgedRisk: Math.abs(positionSize * currentPrice * volatility / 100),
    recommendedStrategy: volatility > 15 ? 'Delta Hedge' : 'Collar Strategy'
  };
}

function generateAnalysis(features: ReturnType<typeof calculateFeatures>) {
  const signals: string[] = [];
  let bullishSignals = 0;
  let bearishSignals = 0;

  if (features.priceAboveSMA5) {
    bullishSignals++;
    signals.push('PRICE > SMA(5)');
  } else {
    bearishSignals++;
    signals.push('PRICE < SMA(5)');
  }

  if (features.priceAboveSMA10) {
    bullishSignals++;
    signals.push('PRICE > SMA(10)');
  } else {
    bearishSignals++;
    signals.push('PRICE < SMA(10)');
  }

  if (features.momentum > 5) {
    bullishSignals += 2;
    signals.push(`MOMENTUM: +${features.momentum.toFixed(1)}%`);
  } else if (features.momentum < -5) {
    bearishSignals += 2;
    signals.push(`MOMENTUM: ${features.momentum.toFixed(1)}%`);
  }

  if (features.rsi > 70) {
    bearishSignals++;
    signals.push(`RSI OVERBOUGHT: ${features.rsi.toFixed(0)}`);
  } else if (features.rsi < 30) {
    bullishSignals++;
    signals.push(`RSI OVERSOLD: ${features.rsi.toFixed(0)}`);
  }

  if (features.orderImbalance > 20) {
    bullishSignals++;
    signals.push('BID PRESSURE HIGH');
  } else if (features.orderImbalance < -20) {
    bearishSignals++;
    signals.push('ASK PRESSURE HIGH');
  }

  if (features.volatility > 10) {
    signals.push(`HIGH VOLATILITY: ${features.volatility.toFixed(1)}%`);
  }

  if (features.spreadPercent > 5) {
    signals.push(`WIDE SPREAD: ${features.spreadPercent.toFixed(2)}%`);
  }

  const totalSignals = bullishSignals + bearishSignals;
  const confidence = totalSignals > 0 
    ? Math.abs(bullishSignals - bearishSignals) / totalSignals 
    : 0;

  let predictedDirection: 'YES' | 'NO' | 'NEUTRAL';
  let predictedProbability: number;

  if (bullishSignals > bearishSignals + 1) {
    predictedDirection = 'YES';
    predictedProbability = Math.min(0.95, features.currentPrice + (confidence * 0.15));
  } else if (bearishSignals > bullishSignals + 1) {
    predictedDirection = 'NO';
    predictedProbability = Math.max(0.05, features.currentPrice - (confidence * 0.15));
  } else {
    predictedDirection = 'NEUTRAL';
    predictedProbability = features.currentPrice;
  }

  let reasoning = '';
  if (predictedDirection === 'YES') {
    reasoning = `Technical indicators suggest upward momentum. ${signals.slice(0, 3).join(', ')}. Order book shows ${features.orderImbalance > 0 ? 'positive' : 'neutral'} bid/ask imbalance.`;
  } else if (predictedDirection === 'NO') {
    reasoning = `Technical indicators suggest downward pressure. ${signals.slice(0, 3).join(', ')}. Volume analysis indicates ${features.volume24h > 50000 ? 'significant' : 'moderate'} trading activity.`;
  } else {
    reasoning = `Mixed signals across indicators. ${signals.slice(0, 3).join(', ')}. Market appears to be in consolidation phase with ${features.volatility < 5 ? 'low' : 'elevated'} volatility.`;
  }

  return {
    prediction: {
      direction: predictedDirection,
      probability: predictedProbability,
      confidence: confidence
    },
    analysis: {
      signals,
      reasoning,
      metrics: {
        momentum: features.momentum,
        volatility: features.volatility,
        rsi: features.rsi,
        orderImbalance: features.orderImbalance,
        trend: features.trend
      }
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      priceHistory, 
      orderbook, 
      currentPrice, 
      volume24h, 
      liquidity, 
      spread, 
      question,
      positionSize = 100,
      avgPrice,
      simulationCount = 500,
      timeHorizon = 30
    } = body as MarketData;

    if (!priceHistory || !Array.isArray(priceHistory)) {
      return NextResponse.json({ error: 'Price history required' }, { status: 400 });
    }

    const actualCurrentPrice = currentPrice || priceHistory[priceHistory.length - 1] || 0.5;
    const actualAvgPrice = avgPrice || actualCurrentPrice;

    const features = calculateFeatures({
      priceHistory,
      orderbook: orderbook || { bids: [], asks: [] },
      currentPrice: actualCurrentPrice,
      volume24h: volume24h || 0,
      liquidity: liquidity || 0,
      spread: spread || 0,
      question: question || ''
    });

    const analysis = generateAnalysis(features);

    const drift = features.meanReturn * 252;
    const annualizedVol = features.dailyVolatility * Math.sqrt(252);
    const monteCarlo = runMonteCarloSimulation(
      actualCurrentPrice,
      drift,
      Math.max(0.1, annualizedVol),
      timeHorizon,
      simulationCount
    );

    const scenarios = calculateScenarioAnalysis(
      actualCurrentPrice,
      positionSize,
      actualAvgPrice
    );

    const hedge = calculateHedgeAnalysis(
      actualCurrentPrice,
      positionSize,
      features.volatility
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      model: 'PolyTerminal-LocalAnalysis-v1',
      features,
      ...analysis,
      monteCarlo,
      scenarios,
      hedge,
      historicalPrices: priceHistory.slice(-50),
    });

  } catch (error) {
    console.error('Analysis Error:', error);
    return NextResponse.json({ error: 'Failed to analyze market' }, { status: 500 });
  }
}
