from typing import List, Dict, Any
from app.models import HedgeRecommendation, HedgeMarket, Market

class HedgeAnalyzer:
    def suggest_hedges(
        self, 
        current_market: Market, 
        position: Dict[str, float], 
        related_markets: List[Market]
    ) -> HedgeRecommendation:
        shares = position.get("shares", 0)
        
        hedge_markets = []
        for rm in related_markets:
            if rm.id == current_market.id:
                continue
                
            # Heuristic for correlation proxy
            # If they are in the same event, they are likely related
            correlation = 0.7 if rm.group_id == current_market.group_id else 0.3
            
            # Liquidity score (0-1)
            liquidity_score = min(rm.liquidity / 1000000, 1.0)
            
            # Suggested size (e.g. 20% of current position value)
            current_value = shares * float(current_market.outcome_prices[0] if current_market.outcome_prices else 0.5)
            suggested_size = current_value * correlation * 0.5
            
            hedge_markets.append(HedgeMarket(
                market_id=rm.id,
                reason=f"High correlation proxy ({correlation}) due to shared event/category.",
                correlation_proxy=correlation,
                liquidity_score=round(liquidity_score, 2),
                suggested_size=round(suggested_size, 2),
                expected_downside_reduction=round(correlation * 0.4 * 100, 2)
            ))
            
        # Sort by correlation and liquidity
        hedge_markets.sort(key=lambda x: (x.correlation_proxy, x.liquidity_score), reverse=True)
        
        return HedgeRecommendation(
            hedge_markets=hedge_markets[:5],
            caveats=[
                "Correlation proxies are estimated based on metadata and category overlap.",
                "Liquidity scores represent the depth of the hedge market.",
                "Hedge suggestions do not account for individual risk tolerance."
            ]
        )
