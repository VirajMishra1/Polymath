export interface MarketArticle {
  id: string;
  title: string;
  source: string;
  sourceType: 'news' | 'reddit' | 'twitter' | 'analysis';
  url: string;
  publishedAt: string;
  timestamp: number;
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  impactScore: number;
  keyPoints: string[];
}

export interface PriceEvent {
  index?: number;
  timestamp: number;
  price: number;
  priceChange: number;
  priceChangePct: number;
  type: 'dip' | 'spike' | 'normal';
  significance: number;
  articles: MarketArticle[];
  aiAnalysis?: string;
}

const MARKET_540218_ARTICLES: MarketArticle[] = [
  {
    id: 'art-001',
    title: 'CJ Stroud Shows MVP Form in Preseason Opener',
    source: 'ESPN',
    sourceType: 'news',
    url: 'https://espn.com/nfl/texans-stroud-preseason',
    publishedAt: '2025-08-15T14:30:00Z',
    timestamp: 1723732200,
    summary: 'CJ Stroud threw for 285 yards and 3 TDs in limited action, displaying elite accuracy and decision-making that has analysts projecting MVP-caliber season.',
    sentiment: 'bullish',
    impactScore: 8,
    keyPoints: ['89% completion rate', '3 TDs in one half', 'Perfect passer rating', 'Chemistry with Nico Collins exceptional']
  },
  {
    id: 'art-002',
    title: 'Texans Sign Key Free Agent Edge Rusher',
    source: 'NFL Network',
    sourceType: 'news',
    url: 'https://nfl.com/texans-edge-signing',
    publishedAt: '2025-07-20T09:00:00Z',
    timestamp: 1721469600,
    summary: 'Houston bolsters pass rush with proven veteran, addressing one of their few weaknesses from 2024 playoff run.',
    sentiment: 'bullish',
    impactScore: 7,
    keyPoints: ['12 sacks last season', '3-year $45M deal', 'Elite run defender', 'Playoff experience']
  },
  {
    id: 'art-003',
    title: 'Nico Collins Suffers Hamstring Injury in Practice',
    source: 'Houston Chronicle',
    sourceType: 'news',
    url: 'https://houstonchronicle.com/texans-collins-injury',
    publishedAt: '2025-09-01T16:45:00Z',
    timestamp: 1725209100,
    summary: 'Star WR Nico Collins exits practice with hamstring tightness, MRI scheduled. Team expects 2-4 week recovery but concerned about re-injury risk.',
    sentiment: 'bearish',
    impactScore: 9,
    keyPoints: ['Team\'s leading receiver', 'History of soft tissue issues', '2-4 week timeline', 'Stroud chemistry affected']
  },
  {
    id: 'art-004',
    title: '[Post Game Thread] Chiefs def. Texans 31-24 - Mahomes Magic Continues',
    source: 'r/nfl',
    sourceType: 'reddit',
    url: 'https://reddit.com/r/nfl/chiefs-texans-week3',
    publishedAt: '2025-09-22T23:30:00Z',
    timestamp: 1727050200,
    summary: 'Texans fall to Chiefs in primetime showdown. Defense struggled against Mahomes in 4th quarter. Questions arise about whether Houston can beat elite teams.',
    sentiment: 'bearish',
    impactScore: 8,
    keyPoints: ['17-0 fourth quarter collapse', 'Secondary exposed', 'Play calling criticized', 'Stroud still impressive']
  },
  {
    id: 'art-005',
    title: 'Texans Rout Ravens 35-14 in Statement Win',
    source: 'The Athletic',
    sourceType: 'news',
    url: 'https://theathletic.com/texans-ravens-statement',
    publishedAt: '2025-10-13T22:00:00Z',
    timestamp: 1728856800,
    summary: 'Houston dominates Baltimore in every phase. Defense holds Lamar to season-low 178 yards. National media declaring Texans legitimate Super Bowl contenders.',
    sentiment: 'bullish',
    impactScore: 9,
    keyPoints: ['Held Ravens to 14 points', 'Stroud 4 TDs', 'Top-5 defense performance', 'Prime time statement']
  },
  {
    id: 'art-006',
    title: 'Tank Dell Season-Ending ACL Tear Confirmed',
    source: 'Adam Schefter',
    sourceType: 'twitter',
    url: 'https://twitter.com/adamschefter/texans-dell-acl',
    publishedAt: '2025-11-05T11:20:00Z',
    timestamp: 1730805600,
    summary: 'MRI confirms worst fears: Tank Dell suffered complete ACL tear in Sunday\'s win. Second major injury for WR corps this season.',
    sentiment: 'bearish',
    impactScore: 10,
    keyPoints: ['Season-ending injury', 'WR depth depleted', 'Already without Collins for weeks', 'Playoff concerns mounting']
  },
  {
    id: 'art-007',
    title: 'Analysis: Texans Offense Adapts Without Key Receivers',
    source: 'PFF',
    sourceType: 'analysis',
    url: 'https://pff.com/texans-offensive-analysis',
    publishedAt: '2025-11-15T14:00:00Z',
    timestamp: 1731679200,
    summary: 'Despite WR injuries, Houston\'s offense ranks 7th in efficiency. Stroud spreading ball to TEs and RBs effectively. Question remains: is this sustainable in playoffs?',
    sentiment: 'neutral',
    impactScore: 6,
    keyPoints: ['7th in offensive efficiency', 'TE production up 40%', 'RB receiving yards doubled', 'Deep ball frequency down']
  },
  {
    id: 'art-008',
    title: 'Collins Returns to Practice, On Track for Playoff Push',
    source: 'ESPN',
    sourceType: 'news',
    url: 'https://espn.com/nfl/collins-return',
    publishedAt: '2025-11-20T16:30:00Z',
    timestamp: 1732120200,
    summary: 'Nico Collins returned to full practice today. Team optimistic about full strength WR1 for playoff stretch. Chemistry with Stroud expected to return quickly.',
    sentiment: 'bullish',
    impactScore: 8,
    keyPoints: ['Full practice participation', 'No setbacks reported', 'Could play Week 13', 'Stroud thrilled']
  },
  {
    id: 'art-009',
    title: 'Hot Take: Texans Are Paper Tigers - Will Fail in Playoffs Again',
    source: 'r/nfl',
    sourceType: 'reddit',
    url: 'https://reddit.com/r/nfl/texans-overrated-take',
    publishedAt: '2025-12-01T20:15:00Z',
    timestamp: 1733083500,
    summary: 'Popular thread arguing Texans haven\'t beaten any truly elite teams this year. Schedule strength questioned. Comparisons to last year\'s playoff exit concerning fans.',
    sentiment: 'bearish',
    impactScore: 5,
    keyPoints: ['Strength of schedule concerns', '0-2 vs playoff teams', 'Chiefs loss narrative', 'Young team inexperience']
  },
  {
    id: 'art-010',
    title: 'Texans Clinch AFC South, Secure First-Round Bye',
    source: 'NFL Network',
    sourceType: 'news',
    url: 'https://nfl.com/texans-clinch-division',
    publishedAt: '2025-12-15T23:45:00Z',
    timestamp: 1734306300,
    summary: 'Houston clinches division title and first-round bye with dominating win over Colts. Team sitting at 13-2, best record in franchise history.',
    sentiment: 'bullish',
    impactScore: 9,
    keyPoints: ['First-round bye secured', '13-2 record', 'Franchise best', 'Home field advantage']
  },
  {
    id: 'art-011',
    title: 'Stroud Ankle Injury Scare in Week 16',
    source: 'Houston Chronicle',
    sourceType: 'news',
    url: 'https://houstonchronicle.com/stroud-ankle',
    publishedAt: '2025-12-22T14:00:00Z',
    timestamp: 1734876000,
    summary: 'CJ Stroud limped off field in 4th quarter. X-rays negative but high ankle sprain possible. Team being cautious with playoffs approaching.',
    sentiment: 'bearish',
    impactScore: 10,
    keyPoints: ['Limped off field', 'X-rays negative', 'High ankle sprain possible', 'May rest Week 17-18']
  },
  {
    id: 'art-012',
    title: 'Stroud Cleared, "100% Ready for Playoffs"',
    source: 'Adam Schefter',
    sourceType: 'twitter',
    url: 'https://twitter.com/adamschefter/stroud-cleared',
    publishedAt: '2025-12-28T10:00:00Z',
    timestamp: 1735383600,
    summary: 'CJ Stroud officially cleared for playoff action. MRI showed no structural damage. QB says he feels great and is focused on Super Bowl run.',
    sentiment: 'bullish',
    impactScore: 9,
    keyPoints: ['No structural damage', 'Cleared for contact', 'Full practice participant', 'Super Bowl focused']
  },
  {
    id: 'art-013',
    title: 'Texans Crush Steelers 38-17 in Divisional Round',
    source: 'ESPN',
    sourceType: 'news',
    url: 'https://espn.com/texans-divisional-win',
    publishedAt: '2026-01-12T00:30:00Z',
    timestamp: 1736641800,
    summary: 'Houston dismantles Pittsburgh in dominant playoff performance. Stroud throws 4 TDs, defense forces 4 turnovers. AFC Championship awaits.',
    sentiment: 'bullish',
    impactScore: 10,
    keyPoints: ['38-17 victory', '4 TDs from Stroud', '4 turnovers forced', 'AFC Championship bound']
  },
  {
    id: 'art-014',
    title: '[Game Thread] AFC Championship: Texans vs Chiefs',
    source: 'r/Texans',
    sourceType: 'reddit',
    url: 'https://reddit.com/r/texans/afccg-hype',
    publishedAt: '2026-01-19T18:00:00Z',
    timestamp: 1737309600,
    summary: 'Massive hype thread for AFC Championship rematch. Fans debating if team can finally beat Mahomes. Ticket demand at all-time high.',
    sentiment: 'neutral',
    impactScore: 7,
    keyPoints: ['Chiefs rematch', 'Revenge game narrative', 'Ticket prices record high', 'National spotlight']
  },
  {
    id: 'art-015',
    title: 'TEXANS STUN CHIEFS 27-24, SUPER BOWL BOUND',
    source: 'Houston Chronicle',
    sourceType: 'news',
    url: 'https://houstonchronicle.com/super-bowl-bound',
    publishedAt: '2026-01-19T23:45:00Z',
    timestamp: 1737330300,
    summary: 'Houston defeats Kansas City in overtime thriller! Stroud leads game-winning drive. Texans heading to Super Bowl LX for first time in franchise history.',
    sentiment: 'bullish',
    impactScore: 10,
    keyPoints: ['27-24 OT victory', 'Beat Mahomes', 'First Super Bowl in franchise history', 'Stroud game-winning drive']
  }
];

export function getArticlesForMarket(marketId: string): MarketArticle[] {
  if (marketId === '540218') {
    return MARKET_540218_ARTICLES;
  }
  return [];
}

export function detectPriceEvents(
  priceHistory: { timestamp: number; price: number; index?: number }[],
  marketId: string
): PriceEvent[] {
  const articles = getArticlesForMarket(marketId);
  
  if (priceHistory.length < 5) return [];
  
  const windowSize = 5;
  const minDistanceApart = 10;
  const minChangePct = 8;
  
  interface CandidateEvent {
    index: number;
    timestamp: number;
    price: number;
    priceChange: number;
    priceChangePct: number;
    type: 'dip' | 'spike';
    significance: number;
  }
  
  const candidates: CandidateEvent[] = [];
  
  for (let i = windowSize; i < priceHistory.length - windowSize; i++) {
    const current = priceHistory[i];
    
    const beforePrices = priceHistory.slice(Math.max(0, i - windowSize), i).map(p => p.price);
    const afterPrices = priceHistory.slice(i + 1, Math.min(priceHistory.length, i + windowSize + 1)).map(p => p.price);
    
    const avgBefore = beforePrices.reduce((a, b) => a + b, 0) / beforePrices.length;
    const avgAfter = afterPrices.reduce((a, b) => a + b, 0) / afterPrices.length;
    const surroundingAvg = (avgBefore + avgAfter) / 2;
    
    const changeFromAvg = current.price - surroundingAvg;
    const changePct = (changeFromAvg / surroundingAvg) * 100;
    
    if (Math.abs(changePct) >= minChangePct) {
      const type = changePct < 0 ? 'dip' : 'spike';
      const significance = Math.min(10, Math.round(Math.abs(changePct) / 3));
      
      candidates.push({
        index: i,
        timestamp: current.timestamp,
        price: current.price,
        priceChange: changeFromAvg,
        priceChangePct: changePct,
        type,
        significance
      });
    }
  }
  
  const dips = candidates
    .filter(c => c.type === 'dip')
    .sort((a, b) => a.priceChangePct - b.priceChangePct);
  
  const spikes = candidates
    .filter(c => c.type === 'spike')
    .sort((a, b) => b.priceChangePct - a.priceChangePct);
  
  function selectTopWithSpacing(sorted: CandidateEvent[], count: number): CandidateEvent[] {
    const selected: CandidateEvent[] = [];
    for (const candidate of sorted) {
      const tooClose = selected.some(s => Math.abs(s.index - candidate.index) < minDistanceApart);
      if (!tooClose) {
        selected.push(candidate);
        if (selected.length >= count) break;
      }
    }
    return selected;
  }
  
  const topDips = selectTopWithSpacing(dips, 3);
  const topSpikes = selectTopWithSpacing(spikes, 3);
  
  const selectedCandidates = [...topDips, ...topSpikes];
  
  const events: PriceEvent[] = selectedCandidates.map(candidate => {
    const relevantArticles = articles.filter(art => {
      const articleTime = new Date(art.publishedAt).getTime() / 1000;
      const timeDiff = Math.abs(articleTime - candidate.timestamp);
      const dayInSeconds = 86400 * 5;
      return timeDiff < dayInSeconds;
    }).sort((a, b) => b.impactScore - a.impactScore);
    
    let aiAnalysis = '';
    if (candidate.type === 'dip') {
      const bearishArticles = relevantArticles.filter(a => a.sentiment === 'bearish');
      if (bearishArticles.length > 0) {
        aiAnalysis = `This ${Math.abs(candidate.priceChangePct).toFixed(1)}% price drop appears to correlate with negative news: "${bearishArticles[0].title}". ${bearishArticles[0].summary} The market sentiment shifted bearish as traders reacted to this development.`;
      } else {
        aiAnalysis = `This ${Math.abs(candidate.priceChangePct).toFixed(1)}% correction occurred during a period of market consolidation. While no major negative catalysts were identified, profit-taking and position rebalancing likely contributed to the price movement.`;
      }
    } else {
      const bullishArticles = relevantArticles.filter(a => a.sentiment === 'bullish');
      if (bullishArticles.length > 0) {
        aiAnalysis = `This ${candidate.priceChangePct.toFixed(1)}% price surge correlates with positive developments: "${bullishArticles[0].title}". ${bullishArticles[0].summary} Bullish sentiment drove increased buying activity.`;
      } else {
        aiAnalysis = `This ${candidate.priceChangePct.toFixed(1)}% increase reflects growing market confidence despite no specific catalyst. Momentum traders and position building contributed to the upward movement.`;
      }
    }
    
    return {
      index: candidate.index,
      timestamp: candidate.timestamp,
      price: candidate.price,
      priceChange: candidate.priceChange,
      priceChangePct: candidate.priceChangePct,
      type: candidate.type,
      significance: candidate.significance,
      articles: relevantArticles.slice(0, 5),
      aiAnalysis
    };
  });
  
  return events;
}

export function generateAIAnalysisForEvent(event: PriceEvent): string {
  if (event.aiAnalysis) return event.aiAnalysis;
  
  const direction = event.type === 'dip' ? 'decrease' : 'increase';
  const magnitude = Math.abs(event.priceChangePct).toFixed(1);
  
  if (event.articles.length === 0) {
    return `This ${magnitude}% ${direction} occurred without any identifiable news catalyst. It may be attributed to normal market fluctuations, algorithmic trading, or position adjustments by large holders.`;
  }
  
  const primaryArticle = event.articles[0];
  return `Analysis indicates this ${magnitude}% ${direction} was primarily driven by: "${primaryArticle.title}" (${primaryArticle.source}). ${primaryArticle.summary} Impact score: ${primaryArticle.impactScore}/10.`;
}
