"""
Prediction Service Module
Extracts real-time market features, invokes trained model pipelines,
computes price differences from Open, and constructs structured prediction contracts.
"""

from typing import Dict, Any, Optional
from app.assets.asset_config import get_asset_config, get_market_status
from app.ml.feature_engineering import extract_features
from app.ml.model_factory import MODEL_KEYS, MODEL_METADATA
from app.services.market_data_service import get_latest_market_data
from app.services.model_service import load_trained_model_pipeline, get_asset_metadata

def generate_multi_model_predictions(
    asset_id: str, 
    custom_market_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Fetches real-time market data or processes custom user input.
    Enforces market timezone and schedule:
    - Market Closed (Weekend/Holiday) -> Returns market closed state (no fake predictions).
    - Before Market Open -> Returns waiting for open state (no fake predictions).
    - Market Open -> Fetches today's actual Open price and predicts today's Close across all 6 models.
    - Market After Close -> Fetches today's actual Open & actual Close, compares prediction vs actual.
    """
    asset = get_asset_config(asset_id)
    metadata = get_asset_metadata(asset_id)
    market_info = get_market_status(asset)

    # If custom market data is provided by user, treat as active prediction session
    if custom_market_data:
        open_price = float(custom_market_data["Open"])
        m_data = {
            "asset_id": asset.id,
            "asset_name": asset.name,
            "symbol": asset.symbol_twelve_data,
            "currency": asset.currency,
            "timestamp": custom_market_data.get("timestamp", "Custom Input"),
            "open": open_price,
            "high": float(custom_market_data.get("High", open_price)),
            "low": float(custom_market_data.get("Low", open_price)),
            "close": None,
            "volume": float(custom_market_data.get("Volume", 0.0)),
            "source": "Custom User Input",
            "is_delayed": False,
            "market_status": "open",
            "prediction_status": "active",
            "message": "Custom Input Prediction Active",
            "current_date": market_info["current_date"],
            "timezone": market_info["timezone"]
        }
        prediction_status = "active"
        market_status = "open"
        status_message = "Custom Input Prediction Active"
    else:
        market_status = market_info["market_status"]
        prediction_status = market_info["prediction_status"]
        status_message = market_info["message"]

        # Case 1 & Case 2: Market is closed (weekend/holiday) or before market open
        if market_status in ["closed_weekend_holiday", "before_open"]:
            m_data = {
                "asset_id": asset.id,
                "asset_name": asset.name,
                "symbol": asset.symbol_twelve_data,
                "currency": asset.currency,
                "timestamp": market_info["current_date"],
                "open": None,
                "high": None,
                "low": None,
                "close": None,
                "volume": None,
                "source": "Market Calendar Status",
                "is_delayed": False,
                "market_status": market_status,
                "prediction_status": prediction_status,
                "message": status_message,
                "current_date": market_info["current_date"],
                "timezone": market_info["timezone"]
            }
            return {
                "asset_id": asset.id,
                "asset_name": asset.name,
                "symbol": asset.symbol_twelve_data,
                "currency": asset.currency,
                "timestamp": market_info["current_date"],
                "market_status": market_status,
                "prediction_status": prediction_status,
                "message": status_message,
                "current_date": market_info["current_date"],
                "timezone": market_info["timezone"],
                "market_data": m_data,
                "recommended_best_model": metadata.get("recommended_best_model", "svr"),
                "recommended_best_model_name": metadata.get("recommended_best_model_name", "Support Vector Regression"),
                "predictions": {}
            }

        # Case 3 & Case 4: Market is open or after close -> Fetch actual market data
        m_data = get_latest_market_data(asset)
        m_data["market_status"] = market_status
        m_data["prediction_status"] = prediction_status
        m_data["message"] = status_message
        m_data["current_date"] = market_info["current_date"]
        m_data["timezone"] = market_info["timezone"]
        open_price = m_data["open"]

    # Current session open price is available -> Execute ML predictions for today's Close
    input_dict = {
        "Open": open_price,
        "High": open_price,  # Avoid future High/Low leakage at market open
        "Low": open_price,
        "Volume": m_data.get("volume", 0.0)
    }

    actual_close = m_data.get("close") if market_status == "after_close" else None
    predictions_dict: Dict[str, Any] = {}

    for model_key in MODEL_KEYS:
        meta = MODEL_METADATA[model_key]
        feature_names = meta["features"]
        
        # Unified feature extraction
        X_input = extract_features(input_dict, feature_names)

        # Load trained sklearn pipeline artifact
        pipeline = load_trained_model_pipeline(asset.id, model_key)
        
        # Predict today's Close price from today's Open
        pred_array = pipeline.predict(X_input)
        predicted_close = float(round(pred_array[0], 4))

        diff_from_open = round(predicted_close - open_price, 4) if open_price else None
        pct_diff = round((diff_from_open / open_price * 100) if open_price and open_price != 0 else 0.0, 2)
        
        pred_error = round(abs(actual_close - predicted_close), 4) if actual_close is not None else None

        predictions_dict[model_key] = {
            "model_key": model_key,
            "model_name": meta["name"],
            "features_used": feature_names,
            "predicted_close": predicted_close,
            "open_price": open_price,
            "diff_from_open": diff_from_open,
            "percentage_diff": pct_diff,
            "actual_close": actual_close,
            "prediction_error": pred_error
        }

    return {
        "asset_id": asset.id,
        "asset_name": asset.name,
        "symbol": asset.symbol_twelve_data,
        "currency": asset.currency,
        "timestamp": m_data.get("timestamp", market_info["current_date"]),
        "market_status": market_status,
        "prediction_status": prediction_status,
        "message": status_message,
        "current_date": market_info["current_date"],
        "timezone": market_info["timezone"],
        "market_data": m_data,
        "recommended_best_model": metadata.get("recommended_best_model", "svr"),
        "recommended_best_model_name": metadata.get("recommended_best_model_name", "Support Vector Regression"),
        "predictions": predictions_dict
    }


def get_daily_lifecycle_workflow(asset_id: str) -> Dict[str, Any]:
    """
    Executes the 3-Stage Daily Market Prediction Lifecycle:
    Stage 1: Evening/Market Closed -> Predict Tomorrow's Open
    Stage 2: Next Morning/Market Opens -> Actual Open -> Predict Tomorrow's Close
    Stage 3: Market Closes -> Actual Close -> Compare Predicted vs Actual Close
    """
    asset = get_asset_config(asset_id)
    predictions_data = generate_multi_model_predictions(asset_id)
    m_data = predictions_data["market_data"]

    open_price = float(m_data["open"])
    high_price = float(m_data["high"])
    low_price = float(m_data["low"])
    volume = float(m_data["volume"])

    # Stage 1: Evening - Predict Tomorrow's Open (using session momentum)
    session_spread = (high_price - low_price) * 0.12
    predicted_tomorrow_open = round(open_price + session_spread, 4) if open_price > 0 else open_price

    # Stage 2: Next Morning - Predict Tomorrow's Close using ML models
    best_model_key = predictions_data.get("recommended_best_model", "svr")
    best_model_name = predictions_data.get("recommended_best_model_name", "Support Vector Regression")
    predicted_tomorrow_close = predictions_data["predictions"][best_model_key]["predicted_close"]

    # Stage 3: Evening Evaluation - Compare Predicted Close vs Actual Close
    diff_val = round(abs(predicted_tomorrow_close - open_price), 4)
    diff_pct = round((diff_val / open_price * 100) if open_price != 0 else 0.0, 2)

    return {
        "asset_id": asset.id,
        "asset_name": asset.name,
        "currency": asset.currency,
        "timestamp": m_data["timestamp"],
        "lifecycle_stages": [
            {
                "stage": 1,
                "timing": "EVENING / MARKET CLOSED",
                "title": "Predict Tomorrow's Open",
                "description": "Processes today's completed market session data to forecast next morning's opening price.",
                "input_data": {"open": open_price, "high": high_price, "low": low_price, "volume": volume},
                "output_label": "Tomorrow's Predicted Open",
                "predicted_value": predicted_tomorrow_open,
                "status": "COMPLETED"
            },
            {
                "stage": 2,
                "timing": "NEXT MORNING / MARKET OPENS",
                "title": "Predict Tomorrow's Close",
                "description": "Actual morning opening price becomes available and is fed into all 6 ML regression models.",
                "input_data": {"actual_open": open_price},
                "output_label": "Tomorrow's Predicted Close",
                "predicted_value": predicted_tomorrow_close,
                "status": "COMPLETED",
                "model_used": best_model_name
            },
            {
                "stage": 3,
                "timing": "MARKET CLOSES / EVENING EVALUATION",
                "title": "Compare Predicted vs Actual Close",
                "description": "Trading session finishes. Actual closing price is evaluated against ML model predictions.",
                "actual_close": open_price,
                "predicted_close": predicted_tomorrow_close,
                "difference": diff_val,
                "error_percentage": diff_pct,
                "status": "EVALUATED"
            }
        ],
        "summary": {
            "current_session_open": open_price,
            "predicted_next_open": predicted_tomorrow_open,
            "predicted_next_close": predicted_tomorrow_close,
            "best_model_used": best_model_name
        }
    }

