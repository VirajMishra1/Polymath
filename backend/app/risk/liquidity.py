from typing import List, Dict, Any
from app.models import LiquidityMetrics, SlippageEstimate, WallLevel, Orderbook

class LiquidityAnalyzer:
    def compute_liquidity_metrics(self, orderbook: Orderbook, market_id: str) -> LiquidityMetrics:
        # Define standard order sizes to test slippage
        order_sizes = [1000, 5000, 10000, 50000, 100000] # USD
        
        slippage_estimates = []
        for size in order_sizes:
            # We assume buying "Yes" (hitting the asks)
            estimate = self._calculate_slippage(orderbook.asks, size)
            slippage_estimates.append(estimate)
            
        # Identify "walls" (significant liquidity at specific price levels)
        # A wall is defined as a level with > 10% of top 50 depth
        wall_levels = []
        
        # Bids
        total_bid_depth = sum(b.size * b.price for b in orderbook.bids[:50])
        for b in orderbook.bids[:50]:
            if (b.size * b.price) > (total_bid_depth * 0.1):
                wall_levels.append(WallLevel(
                    price=b.price,
                    size_usd=round(b.size * b.price, 2),
                    side="bid"
                ))
                
        # Asks
        total_ask_depth = sum(a.size * a.price for a in orderbook.asks[:50])
        for a in orderbook.asks[:50]:
            if (a.size * a.price) > (total_ask_depth * 0.1):
                wall_levels.append(WallLevel(
                    price=a.price,
                    size_usd=round(a.size * a.price, 2),
                    side="ask"
                ))
                
        return LiquidityMetrics(
            market_id=market_id,
            slippage_estimates=slippage_estimates,
            wall_levels=wall_levels
        )

    def _calculate_slippage(self, levels: List[Any], target_usd: float) -> SlippageEstimate:
        if not levels:
            return SlippageEstimate(order_size_usd=target_usd, expected_avg_fill_price=0, slippage_pct=100)
            
        remaining_usd = target_usd
        total_shares = 0
        best_price = levels[0].price
        
        for level in levels:
            level_usd = level.size * level.price
            if remaining_usd <= level_usd:
                # Fill remaining from this level
                shares = remaining_usd / level.price
                total_shares += shares
                remaining_usd = 0
                break
            else:
                total_shares += level.size
                remaining_usd -= level_usd
                
        if total_shares == 0:
            return SlippageEstimate(order_size_usd=target_usd, expected_avg_fill_price=0, slippage_pct=100)
            
        avg_price = target_usd / total_shares
        slippage = (avg_price - best_price) / best_price if best_price > 0 else 0
        
        # If we couldn't fill the whole order, slippage is high
        if remaining_usd > 0:
            slippage = max(slippage, 0.2) # Minimum 20% if partially filled
            
        return SlippageEstimate(
            order_size_usd=target_usd,
            expected_avg_fill_price=round(avg_price, 4),
            slippage_pct=round(slippage * 100, 2)
        )
