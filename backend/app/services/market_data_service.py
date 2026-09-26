"""
Market Data Service Module
Handles fetching current/latest market data via Twelve Data API with backend TTL caching.
Provides robust fallback to yfinance if Twelve Data API key is missing or encounters rate limits.
"""

import time
import requests
from typing import Dict, Any, Optional
import yfinance as yf
from app.assets.asset_config import AssetConfig
from app.core.config import settings

# In-Memory Cache dictionary: asset_id -> {"timestamp": float, "data": dict}
_MARKET_DATA_CACHE: Dict[str, Dict[str, Any]] = {}

def get_latest_market_data(asset: AssetConfig) -> Dict[str, Any]:
    """
    Fetches latest market data (Open, High, Low, Volume, Timestamp).
    Uses backend TTL cache to prevent exceeding Twelve Data API limits.
    """
    now = time.time()
    cache_entry = _MARKET_DATA_CACHE.get(asset.id)

    if cache_entry and (now - cache_entry["timestamp"]) < settings.CACHE_TTL_SECONDS:
        return cache_entry["data"]

    # Try Twelve Data first if API key is provided
    market_data = None
    if settings.TWELVE_DATA_API_KEY and settings.TWELVE_DATA_API_KEY.strip() != "":
        market_data = _fetch_from_twelve_data(asset)

    # Fall back to yfinance if Twelve Data call was unfulfilled or unavailable
    if not market_data:
        market_data = _fetch_from_yfinance_fallback(asset)

    # Store in memory cache
    _MARKET_DATA_CACHE[asset.id] = {
        "timestamp": now,
        "data": market_data
    }

    return market_data

def _fetch_from_twelve_data(asset: AssetConfig) -> Optional[Dict[str, Any]]:
    """
    Calls Twelve Data API /quote endpoint.
    """
    try:
        url = "https://api.twelvedata.com/quote"
        params = {
            "symbol": asset.symbol_twelve_data,
            "apikey": settings.TWELVE_DATA_API_KEY
        }
        if asset.exchange and asset.exchange != "CRYPTO":
            params["exchange"] = asset.exchange

        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200:
            data = res.json()
            if "open" in data and "close" in data:
                open_val = float(data["open"]) if data["open"] else float(data.get("close", 0))
                high_val = float(data.get("high", open_val)) if data.get("high") else open_val
                low_val = float(data.get("low", open_val)) if data.get("low") else open_val
                volume_val = float(data.get("volume", 0)) if data.get("volume") else 0.0
                
                close_val = float(data["close"]) if data.get("close") else None
                return {
                    "asset_id": asset.id,
                    "asset_name": asset.name,
                    "symbol": asset.symbol_twelve_data,
                    "currency": asset.currency,
                    "timestamp": data.get("datetime", time.strftime("%Y-%m-%d %H:%M:%S")),
                    "open": round(open_val, 4),
                    "high": round(high_val, 4),
                    "low": round(low_val, 4),
                    "close": round(close_val, 4) if close_val is not None else None,
                    "volume": round(volume_val, 2),
                    "source": "Twelve Data API",
                    "is_delayed": data.get("is_market_open", True) == False
                }
    except Exception as e:
        print(f"[Warning] Twelve Data API call failed for {asset.name}: {e}")
    return None

import datetime
import numpy as np

def _fetch_from_yfinance_fallback(asset: AssetConfig) -> Dict[str, Any]:
    """
    Fallback method using yfinance fast_info and history to fetch today's live market day data.
    """
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    ticker = yf.Ticker(asset.symbol_yfinance)

    # 1. Try fast_info for live today quote
    try:
        fi = ticker.fast_info
        open_val = float(fi.open) if hasattr(fi, "open") and fi.open and not np.isnan(fi.open) else None
        high_val = float(fi.day_high) if hasattr(fi, "day_high") and fi.day_high and not np.isnan(fi.day_high) else open_val
        low_val = float(fi.day_low) if hasattr(fi, "day_low") and fi.day_low and not np.isnan(fi.day_low) else open_val
        close_val = float(fi.last_price) if hasattr(fi, "last_price") and fi.last_price and not np.isnan(fi.last_price) else None
        vol_val = float(fi.last_volume) if hasattr(fi, "last_volume") and fi.last_volume and not np.isnan(fi.last_volume) else 0.0

        if open_val and open_val > 0:
            return {
                "asset_id": asset.id,
                "asset_name": asset.name,
                "symbol": asset.symbol_yfinance,
                "currency": asset.currency,
                "timestamp": today_str,
                "open": round(open_val, 4),
                "high": round(high_val, 4),
                "low": round(low_val, 4),
                "close": round(close_val, 4) if close_val is not None else None,
                "volume": round(vol_val, 2),
                "source": "yfinance (Real-time Live Quote)",
                "is_delayed": False
            }
    except Exception as e:
        print(f"[Warning] fast_info fetch failed for {asset.name}: {e}")

    # 2. Fallback to 5d history
    hist = ticker.history(period="5d")
    if hist.empty:
        raise RuntimeError(f"Unable to fetch market data for {asset.name} from any source.")

    latest_row = hist.iloc[-1]
    last_date = today_str  # Ensure timestamp reflects today's prediction date

    return {
        "asset_id": asset.id,
        "asset_name": asset.name,
        "symbol": asset.symbol_yfinance,
        "currency": asset.currency,
        "timestamp": last_date,
        "open": round(float(latest_row["Open"]), 4),
        "high": round(float(latest_row["High"]), 4),
        "low": round(float(latest_row["Low"]), 4),
        "close": round(float(latest_row["Close"]), 4),
        "volume": round(float(latest_row["Volume"]), 2),
        "source": "yfinance (Real-time Fallback)",
        "is_delayed": True
    }


