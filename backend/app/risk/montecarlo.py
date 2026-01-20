import numpy as np
from typing import List, Dict, Any
from app.models import MonteCarloResult, TimeseriesPoint

class MonteCarloSimulator:
    def run_monte_carlo(
        self, 
        timeseries: List[TimeseriesPoint], 
        horizon_days: int = 30, 
        n_paths: int = 1000
    ) -> MonteCarloResult:
        if len(timeseries) < 2:
            # Fallback if not enough data
            return self._mock_result(horizon_days, n_paths)
            
        prices = np.array([p.price for p in timeseries])
        
        # Calculate daily returns
        # Midpoint history is hourly, so we calculate hourly returns and scale
        returns = np.diff(prices) / prices[:-1]
        
        # Estimate daily volatility
        # Since history is hourly, hourly_vol * sqrt(24) = daily_vol
        hourly_vol = np.std(returns)
        daily_vol = hourly_vol * np.sqrt(24)
        
        # Current price
        current_price = prices[-1]
        
        # Simulate paths using Geometric Brownian Motion (simplified for prediction markets)
        # S_t = S_0 * exp((mu - 0.5 * sigma^2) * t + sigma * W_t)
        # In prediction markets, mu is often assumed 0 or matches current price expectations
        mu = 0 
        dt = 1 # day
        
        paths = np.zeros((n_paths, horizon_days + 1))
        paths[:, 0] = current_price
        
        for t in range(1, horizon_days + 1):
            z = np.random.standard_normal(n_paths)
            paths[:, t] = paths[:, t-1] * np.exp((mu - 0.5 * daily_vol**2) * dt + daily_vol * np.sqrt(dt) * z)
            
        # Bound paths between 0 and 1
        paths = np.clip(paths, 0.001, 0.999)
        
        # Calculate quantiles for each day
        bands = {
            "p5": np.percentile(paths, 5, axis=0).tolist(),
            "p25": np.percentile(paths, 25, axis=0).tolist(),
            "p50": np.percentile(paths, 50, axis=0).tolist(),
            "p75": np.percentile(paths, 75, axis=0).tolist(),
            "p95": np.percentile(paths, 95, axis=0).tolist(),
        }
        
        return MonteCarloResult(
            horizon_days=horizon_days,
            n_paths=n_paths,
            bands=bands,
            sample_paths=paths[:5].tolist() # Return 5 sample paths for visualization
        )

    def _mock_result(self, horizon_days: int, n_paths: int) -> MonteCarloResult:
        # Fallback with some default volatility
        days = np.arange(horizon_days + 1)
        base = 0.5
        vol = 0.05
        
        bands = {
            "p5": (base - 1.96 * vol * np.sqrt(days)).clip(0.01, 0.99).tolist(),
            "p25": (base - 0.67 * vol * np.sqrt(days)).clip(0.01, 0.99).tolist(),
            "p50": [base] * (horizon_days + 1),
            "p75": (base + 0.67 * vol * np.sqrt(days)).clip(0.01, 0.99).tolist(),
            "p95": (base + 1.96 * vol * np.sqrt(days)).clip(0.01, 0.99).tolist(),
        }
        
        return MonteCarloResult(
            horizon_days=horizon_days,
            n_paths=n_paths,
            bands=bands
        )
