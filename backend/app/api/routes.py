"""
FastAPI REST API Routes
Exposes robust endpoints for asset discovery, historical data, model metadata,
evaluation metrics, real-time predictions, and custom model execution.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Query
from app.assets.asset_config import list_all_assets, get_asset_config
from app.ml.preprocessing import load_local_dataset, download_historical_data
from app.services.model_service import get_asset_metadata, get_asset_comparison
from app.services.prediction_service import generate_multi_model_predictions
from app.models.schemas import (
    AssetInfoResponse,
    PredictionResponse,
    CustomPredictionRequest,
    AssetComparisonResponse
)

router = APIRouter()

@router.get("/health", tags=["System"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "Real-Time Multi-Asset Price Prediction Suite API"}

@router.get("/assets", response_model=List[AssetInfoResponse], tags=["Assets"])
def get_supported_assets():
    """Lists all supported financial assets (Reliance, Bitcoin, Google)."""
    return list_all_assets()

@router.get("/historical/{asset_id}", tags=["Historical Data"])
def get_historical_asset_data(asset_id: str, limit: int = Query(100, ge=10, le=1000)):
    """
    Returns recent historical daily market records (Date, Open, High, Low, Close, Volume).
    """
    try:
        asset = get_asset_config(asset_id)
        df = load_local_dataset(asset.id)
        if df is None:
            df = download_historical_data(asset, years=7)

        df_recent = df.tail(limit).copy()
        records = []
        for _, row in df_recent.iterrows():
            records.append({
                "date": str(row["Date_str"]) if "Date_str" in row else str(row["Date"])[:10],
                "open": float(round(row["Open"], 4)),
                "high": float(round(row["High"], 4)),
                "low": float(round(row["Low"], 4)),
                "close": float(round(row["Close"], 4)),
                "volume": float(round(row["Volume"], 2))
            })
        return {
            "asset_id": asset.id,
            "asset_name": asset.name,
            "currency": asset.currency,
            "total_records": len(df),
            "returned_records": len(records),
            "data": records
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load historical data: {str(e)}")

@router.get("/models/{asset_id}", tags=["Models"])
def get_model_metadata_endpoint(asset_id: str):
    """Returns training parameters, features, and model details for an asset."""
    try:
        return get_asset_metadata(asset_id)
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=404, detail=str(fnf))
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/evaluation/{asset_id}", tags=["Evaluation"])
def get_model_evaluation_endpoint(asset_id: str):
    """Returns chronological train/test evaluation metrics (R², MAE, RMSE, MAPE) for all 6 models."""
    try:
        return get_asset_metadata(asset_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prediction/{asset_id}", response_model=PredictionResponse, tags=["Prediction"])
def get_realtime_predictions_endpoint(asset_id: str):
    """
    Fetches current/latest market data from Twelve Data (with yfinance fallback),
    and executes predictions across ALL 6 machine learning models.
    """
    try:
        return generate_multi_model_predictions(asset_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=404, detail=f"Model artifacts not found: {str(fnf)}. Please run training script.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.post("/prediction", response_model=PredictionResponse, tags=["Prediction"])
def post_custom_prediction_endpoint(payload: CustomPredictionRequest):
    """
    Accepts custom Open, High, Low, Volume inputs and generates predictions across all 6 models.
    """
    try:
        input_data = {
            "Open": payload.Open,
            "High": payload.High if payload.High is not None else payload.Open,
            "Low": payload.Low if payload.Low is not None else payload.Open,
            "Volume": payload.Volume if payload.Volume is not None else 0.0,
            "timestamp": "User Custom Input"
        }
        return generate_multi_model_predictions(payload.asset_id, custom_market_data=input_data)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

from app.services.prediction_service import get_daily_lifecycle_workflow

@router.get("/prediction/daily-workflow/{asset_id}", tags=["Prediction"])
def get_daily_workflow_endpoint(asset_id: str):
    """
    Daily Prediction Lifecycle Endpoint:
    Returns the 3-stage forecasting pipeline:
    1. Evening/Closed: Predict Tomorrow's Open
    2. Morning/Opens: Predict Tomorrow's Close
    3. Closed: Compare Predicted Close vs Actual Close
    """
    try:
        return get_daily_lifecycle_workflow(asset_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Daily workflow error: {str(e)}")


from app.services.holdout_validation_service import get_holdout_validation_data
from app.models.schemas import (
    AssetInfoResponse,
    PredictionResponse,
    CustomPredictionRequest,
    AssetComparisonResponse,
    HoldoutValidationResponse
)

@router.get("/validation/holdout/{asset_id}", response_model=HoldoutValidationResponse, tags=["Evaluation"])
def get_holdout_validation_endpoint(asset_id: str, model_key: str = Query("svr", description="Model algorithm identifier")):
    """
    Dedicated Holdout Validation endpoint (Flow B).
    Evaluates out-of-sample chronological test dataset and returns Actual vs Predicted time-series for chart rendering.
    """
    try:
        return get_holdout_validation_data(asset_id, model_key)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=404, detail=f"Model artifacts missing for asset '{asset_id}': {str(fnf)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Holdout validation error: {str(e)}")

@router.get("/model-comparison/{asset_id}", response_model=AssetComparisonResponse, tags=["Evaluation"])
def get_model_comparison_endpoint(asset_id: str):
    """Returns ranked model comparison metrics and recommended best model."""
    try:
        return get_asset_comparison(asset_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=404, detail=str(fnf))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
