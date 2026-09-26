import datetime
from zoneinfo import ZoneInfo
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class AssetConfig(BaseModel):
    id: str
    name: str
    symbol_yfinance: str
    symbol_twelve_data: str
    asset_type: str  # "stock" or "crypto"
    currency: str
    exchange: Optional[str] = None
    description: str
    timezone: str = "UTC"
    open_time: str = "09:00"
    close_time: str = "17:00"
    trading_days: List[int] = [0, 1, 2, 3, 4]  # Mon=0, Sun=6

ASSETS: Dict[str, AssetConfig] = {
    "reliance": AssetConfig(
        id="reliance",
        name="Reliance Industries Ltd.",
        symbol_yfinance="RELIANCE.NS",
        symbol_twelve_data="RELIANCE",
        asset_type="stock",
        currency="INR",
        exchange="NSE",
        description="India's largest conglomerate spanning energy, retail, telecom, and digital services.",
        timezone="Asia/Kolkata",
        open_time="09:15",
        close_time="15:30",
        trading_days=[0, 1, 2, 3, 4]
    ),
    "bitcoin": AssetConfig(
        id="bitcoin",
        name="Bitcoin",
        symbol_yfinance="BTC-USD",
        symbol_twelve_data="BTC/USD",
        asset_type="crypto",
        currency="USD",
        exchange="CRYPTO",
        description="The pioneer decentralized digital cryptocurrency based on blockchain technology.",
        timezone="UTC",
        open_time="00:00",
        close_time="23:59",
        trading_days=[0, 1, 2, 3, 4, 5, 6]  # 24/7
    ),
    "google": AssetConfig(
        id="google",
        name="Google (Alphabet Inc.)",
        symbol_yfinance="GOOGL",
        symbol_twelve_data="GOOGL",
        asset_type="stock",
        currency="USD",
        exchange="NASDAQ",
        description="Global technology leader in online search, cloud computing, AI, and advertising.",
        timezone="America/New_York",
        open_time="09:30",
        close_time="16:00",
        trading_days=[0, 1, 2, 3, 4]
    )
}

def get_asset_config(asset_id: str) -> AssetConfig:
    key = asset_id.lower()
    if key not in ASSETS:
        raise ValueError(f"Unknown asset_id '{asset_id}'. Valid assets are: {list(ASSETS.keys())}")
    return ASSETS[key]

def list_all_assets() -> List[AssetConfig]:
    return list(ASSETS.values())

def get_market_status(asset: AssetConfig, custom_now: Optional[datetime.datetime] = None) -> Dict[str, Any]:
    """
    Determines market status for asset using its specific market timezone and schedule:
    - 'open': Active trading session in progress.
    - 'before_open': Valid trading day, before market opening time.
    - 'after_close': Valid trading day, after market closing time.
    - 'closed_weekend_holiday': Non-trading day (weekend or market holiday).
    """
    tz = ZoneInfo(asset.timezone)
    now_tz = custom_now.astimezone(tz) if custom_now else datetime.datetime.now(tz)
    current_date_str = now_tz.strftime("%Y-%m-%d")
    weekday = now_tz.weekday()

    if asset.asset_type == "crypto":
        return {
            "market_status": "open",
            "prediction_status": "active",
            "message": "Market is open 24/7 (Crypto)",
            "current_date": current_date_str,
            "timezone": asset.timezone,
            "is_trading_day": True,
            "open_time_str": "00:00",
            "close_time_str": "23:59"
        }

    # Weekend / Non-trading day check
    if weekday not in asset.trading_days:
        day_name = now_tz.strftime("%A")
        return {
            "market_status": "closed_weekend_holiday",
            "prediction_status": "market_closed",
            "message": f"Market is closed today ({day_name} - Weekend / Holiday)",
            "current_date": current_date_str,
            "timezone": asset.timezone,
            "is_trading_day": False,
            "open_time_str": asset.open_time,
            "close_time_str": asset.close_time
        }

    open_h, open_m = map(int, asset.open_time.split(":"))
    close_h, close_m = map(int, asset.close_time.split(":"))

    open_dt = now_tz.replace(hour=open_h, minute=open_m, second=0, microsecond=0)
    close_dt = now_tz.replace(hour=close_h, minute=close_m, second=0, microsecond=0)

    if now_tz < open_dt:
        return {
            "market_status": "before_open",
            "prediction_status": "waiting_for_open",
            "message": f"Market opens at {asset.open_time} ({asset.exchange or asset.timezone})",
            "current_date": current_date_str,
            "timezone": asset.timezone,
            "is_trading_day": True,
            "open_time_str": asset.open_time,
            "close_time_str": asset.close_time
        }
    elif open_dt <= now_tz <= close_dt:
        return {
            "market_status": "open",
            "prediction_status": "active",
            "message": f"Market is currently open ({asset.exchange or asset.timezone})",
            "current_date": current_date_str,
            "timezone": asset.timezone,
            "is_trading_day": True,
            "open_time_str": asset.open_time,
            "close_time_str": asset.close_time
        }
    else:
        return {
            "market_status": "after_close",
            "prediction_status": "completed",
            "message": f"Market session closed for today ({asset.exchange or asset.timezone})",
            "current_date": current_date_str,
            "timezone": asset.timezone,
            "is_trading_day": True,
            "open_time_str": asset.open_time,
            "close_time_str": asset.close_time
        }

