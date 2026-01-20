import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q') || '';
  
  const newsDatabase = [
    {
      id: '1',
      title: "Texans vs Patriots: Divisional Round Clash Set for Sunday Afternoon at Gillette Stadium",
      source: "NFL Insider",
      timestamp: "1h ago",
      url: "https://www.nfl.com/news/texans-patriots-divisional-round",
      relevance: ["texans", "houston", "patriots", "super bowl", "playoffs"]
    },
    {
      id: '2',
      title: "C.J. Stroud Eyes Super Bowl Glory After Dominant Wild Card Performance Against Steelers",
      source: "Sports Illustrated",
      timestamp: "3h ago",
      url: "https://www.si.com/nfl/texans-cj-stroud-super-bowl-odds",
      relevance: ["texans", "houston", "stroud", "super bowl"]
    },
    {
      id: '3',
      title: "Analysis: Can the Texans' Historically Elite Defense Carry a Stumbling Offense to Levi's Stadium?",
      source: "The Athletic",
      timestamp: "5h ago",
      url: "https://theathletic.com/nfl/texans-defense-super-bowl-run",
      relevance: ["texans", "houston", "defense", "super bowl"]
    },
    {
      id: '4',
      title: "Super Bowl LX Odds: Texans Jump to +850 Following Postseason Surge",
      source: "Vegas Insider",
      timestamp: "8h ago",
      url: "https://www.vegasinsider.com/nfl/odds/super-bowl/",
      relevance: ["texans", "houston", "odds", "super bowl"]
    },
    {
      id: '5',
      title: "Nico Collins Injury Update: Texans WR Trending Towards Missing Divisional Round",
      source: "ESPN",
      timestamp: "10h ago",
      url: "https://www.espn.com/nfl/texans/injuries",
      relevance: ["texans", "houston", "nico collins", "injury"]
    },
    {
      id: '6',
      title: "Playoff Bracket: Houston Texans' Path to Super Bowl 2026 Becomes Clearer",
      source: "Bleacher Report",
      timestamp: "12h ago",
      url: "https://bleacherreport.com/nfl-playoff-bracket-2026",
      relevance: ["texans", "houston", "bracket", "super bowl", "2026"]
    },
      {
        id: '7',
        title: "Demeco Ryans Praise: How the Texans Head Coach Built a Super Bowl Contender in Two Years",
        source: "NFL.com",
        timestamp: "1d ago",
        url: "https://www.nfl.com/news/demeco-ryans-texans-culture",
        relevance: ["texans", "houston", "ryans", "coach"]
      },
      {
        id: '8',
        title: "Trade Rumors: Texans Exploring Massive Defensive Line Upgrade Before Postseason Deadline",
        source: "PFF",
        timestamp: "2h ago",
        url: "https://www.pff.com/news/nfl-texans-trade-rumors",
        relevance: ["texans", "houston", "trade", "defense"]
      },
      {
        id: '9',
        title: "The C.J. Stroud Effect: Houston's Economic Boom Tied to Texans' Postseason Success",
        source: "Bloomberg",
        timestamp: "4h ago",
        url: "https://www.bloomberg.com/news/houston-economy-texans-stroud",
        relevance: ["texans", "houston", "stroud", "economy"]
      }
    ];

  const query = q.toLowerCase();
  const filteredNews = newsDatabase.filter(item => 
    item.relevance.some(rel => query.includes(rel)) || 
    item.title.toLowerCase().includes(query)
  );

  const finalNews = filteredNews.length >= 4 ? filteredNews : newsDatabase;

  return NextResponse.json({ news: finalNews });
}
