import numpy as np
from typing import List, Dict, Any
from app.models import ScenarioResult, Scenario, ScenarioPnl, MarketSnapshot

class ScenarioAnalyzer:
    def compute_scenarios(
        self, 
        snapshot: MarketSnapshot, 
        position: Dict[str, float], 
        shocks: List[float]
    ) -> ScenarioResult:
        base_price = snapshot.price
        shares = position.get("shares", 0)
        avg_price = position.get("avg_price", base_price)
        
        scenarios = []
        for shock in shocks:
            # shock is in percentage (e.g. -10, 20)
            shock_factor = 1 + (shock / 100.0)
            projected_price = base_price * shock_factor
            
            # Bound price between 0 and 1 for prediction markets
            projected_price = max(0.001, min(0.999, projected_price))
            
            # P&L Calculation
            # Position Value = shares * price
            current_value = shares * base_price
            projected_value = shares * projected_price
            delta = projected_value - current_value
            
            # Max loss/gain relative to cost basis
            # For a Yes position:
            # Max gain is if price goes to 1
            # Max loss is if price goes to 0
            max_gain = shares * (1.0 - avg_price) if shares > 0 else 0
            max_loss = shares * (0.0 - avg_price) if shares > 0 else 0
            
            scenarios.append(Scenario(
                name=f"{shock}% Shock",
                shock_pct=shock,
                projected_price=round(projected_price, 4),
                pnl=ScenarioPnl(
                    position_value_delta=round(delta, 2),
                    max_loss=round(max_loss, 2),
                    max_gain=round(max_gain, 2)
                )
            ))
            
        return ScenarioResult(
            base_price=base_price,
            scenarios=scenarios,
            slider_model={
                "unit": "pct",
                "min": -50,
                "max": 50,
                "step": 1
            }
        )
