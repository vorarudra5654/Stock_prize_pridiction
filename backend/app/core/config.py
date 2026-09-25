"""
Application Core Configuration
Environment variables, path resolution, and global settings.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend root if present
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BACKEND_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "Real-Time Multi-Asset Price Prediction Suite"
    VERSION: str = "3.0.0"
    
    # Paths
    BASE_DIR: Path = BACKEND_DIR
    MODELS_DIR: Path = BASE_DIR / "models"
    DATA_DIR: Path = BASE_DIR / "data" / "historical"
    
    # Twelve Data API
    TWELVE_DATA_API_KEY: str = os.getenv("TWELVE_DATA_API_KEY", "4a70df7cbd1745a98b311f88a60a750a")
    
    # CORS
    _raw_cors: str = os.getenv(
        "CORS_ORIGINS", 
        "https://stock-prize-pridiction.vercel.app,http://localhost:5173,http://localhost:3000,http://localhost:8000"
    )
    CORS_ORIGINS: list = [o.strip().rstrip("/") for o in _raw_cors.split(",") if o.strip()]
    
    # Cache settings
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL", "60"))
    
    # Training defaults
    DEFAULT_YEARS: int = 7

settings = Settings()

# Ensure directories exist
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
