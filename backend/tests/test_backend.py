"""
Backend Unit Tests
Tests asset configuration, feature engineering, model training, predictions, and FastAPI endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.assets.asset_config import list_all_assets, get_asset_config, ASSETS
from app.ml.feature_engineering import extract_features, FEATURE_SET_SIMPLE, FEATURE_SET_MULTI

client = TestClient(app)

def test_asset_config():
    assets = list_all_assets()
    assert len(assets) == 3
    
    reliance = get_asset_config("reliance")
    assert reliance.symbol_yfinance == "RELIANCE.NS"
    assert reliance.symbol_twelve_data == "RELIANCE"

    bitcoin = get_asset_config("bitcoin")
    assert bitcoin.symbol_yfinance == "BTC-USD"
    assert bitcoin.symbol_twelve_data == "BTC/USD"

    google = get_asset_config("google")
    assert google.symbol_yfinance == "GOOGL"

def test_invalid_asset():
    with pytest.raises(ValueError):
        get_asset_config("invalid_asset_name")

def test_feature_engineering_extraction():
    sample_data = {
        "Open": 100.0,
        "High": 105.0,
        "Low": 98.0,
        "Volume": 10000.0
    }
    
    X_simple = extract_features(sample_data, FEATURE_SET_SIMPLE)
    assert X_simple.shape == (1, 1)
    assert X_simple[0][0] == 100.0

    X_multi = extract_features(sample_data, FEATURE_SET_MULTI)
    assert X_multi.shape == (1, 4)
    assert X_multi[0][0] == 100.0
    assert X_multi[0][1] == 105.0
    assert X_multi[0][2] == 98.0
    assert X_multi[0][3] == 10000.0

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_assets_endpoint():
    response = client.get("/assets")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    asset_ids = [a["id"] for a in data]
    assert "reliance" in asset_ids
    assert "bitcoin" in asset_ids
    assert "google" in asset_ids

def test_invalid_prediction_asset():
    response = client.get("/prediction/non_existent_asset")
    assert response.status_code == 404

def test_single_prediction_endpoint():
    # Bitcoin trades 24/7 so predictions are active even on weekends
    response = client.get("/prediction/bitcoin?model_key=svr")
    assert response.status_code == 200
    data = response.json()
    assert data["asset_id"] == "bitcoin"
    assert "predictions" in data
    assert "svr" in data["predictions"]
    svr_pred = data["predictions"]["svr"]
    assert "predicted_close" in svr_pred
    assert "open_price" in svr_pred

def test_market_schedule_status():
    # Reliance is a stock; on weekends it should return market closed status
    response = client.get("/prediction/reliance")
    assert response.status_code == 200
    data = response.json()
    assert "market_status" in data
    assert "prediction_status" in data
    assert "message" in data

def test_holdout_validation_endpoint():
    response = client.get("/validation/holdout/reliance?model_key=svr")
    assert response.status_code == 200
    data = response.json()
    assert data["asset_id"] == "reliance"
    assert data["model_key"] == "svr"
    assert "data" in data
    assert "metrics" in data
    assert len(data["data"]) > 0
    first_pt = data["data"][0]
    assert "date" in first_pt
    assert "actual" in first_pt
    assert "predicted" in first_pt
    assert "error" in first_pt
    assert "error_percent" in first_pt


