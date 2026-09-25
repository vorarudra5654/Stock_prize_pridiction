import { useState, useEffect, useCallback } from 'react';
import {
  fetchAssets,
  fetchRealtimePrediction,
  fetchHistoricalData,
  fetchModelComparison,
  postCustomPrediction,
} from '../services/api';

const DEFAULT_ASSETS = [
  { id: 'reliance', name: 'Reliance Industries', symbol: 'RELIANCE.NS', currency: 'INR', type: 'stock' },
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC-USD', currency: 'USD', type: 'crypto' },
  { id: 'google', name: 'Alphabet / Google', symbol: 'GOOGL', currency: 'USD', type: 'stock' },
];

export const useAssetData = () => {
  const [assets, setAssets] = useState(DEFAULT_ASSETS);
  const [selectedAssetId, setSelectedAssetId] = useState('reliance');
  const [predictionData, setPredictionData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCustomInput, setIsCustomInput] = useState(false);

  // Load supported assets list on mount
  useEffect(() => {
    fetchAssets()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAssets(data);
        }
      })
      .catch((err) => {
        console.warn('Using default asset configuration:', err.message);
      });
  }, []);

  const loadAssetData = useCallback(async (assetId) => {
    setLoading(true);
    setError(null);
    setIsCustomInput(false);
    try {
      const [pred, hist, comp] = await Promise.all([
        fetchRealtimePrediction(assetId),
        fetchHistoricalData(assetId, 100),
        fetchModelComparison(assetId),
      ]);
      setPredictionData(pred);
      setHistoricalData(hist);
      setComparisonData(comp);
    } catch (err) {
      console.error(`Error loading data for ${assetId}:`, err);
      setError(err.message || 'Failed to connect to ML Backend Server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAssetId) {
      loadAssetData(selectedAssetId);
    }
  }, [selectedAssetId, loadAssetData]);

  const handleCustomPrediction = async (open, high, low, volume) => {
    setLoading(true);
    setError(null);
    try {
      const customPred = await postCustomPrediction(selectedAssetId, open, high, low, volume);
      setPredictionData(customPred);
      setIsCustomInput(true);
    } catch (err) {
      setError(err.message || 'Failed to calculate custom prediction.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToRealtime = () => {
    loadAssetData(selectedAssetId);
  };

  return {
    assets,
    selectedAssetId,
    setSelectedAssetId,
    predictionData,
    historicalData,
    comparisonData,
    loading,
    error,
    isCustomInput,
    handleCustomPrediction,
    handleResetToRealtime,
    refreshData: () => loadAssetData(selectedAssetId),
  };
};
