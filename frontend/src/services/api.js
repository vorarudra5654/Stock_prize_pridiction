const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Live Render backend URL as default fallback
  return 'https://stock-prize-pridiction-mk3p.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

async function handleResponse(response, defaultErrorMessage) {
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || defaultErrorMessage || `HTTP Error ${response.status}`);
  }
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  throw new Error(
    `Invalid response format from API. If hosted on Vercel/Netlify, please set the VITE_API_BASE_URL environment variable to your hosted ML backend URL (e.g. https://your-backend.onrender.com).`
  );
}

async function apiFetch(endpoint, options = {}, errorMessage = '') {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = API_BASE_URL ? `${API_BASE_URL}${cleanEndpoint}` : cleanEndpoint;

  try {
    const response = await fetch(url, options);
    return await handleResponse(response, errorMessage);
  } catch (err) {
    if (err.name === 'TypeError' || err.message?.includes('Failed to fetch')) {
      const isHosted =
        typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1';

      const detail = isHosted
        ? `Failed to connect to backend (${url}). Please ensure VITE_API_BASE_URL environment variable is set to your live backend service URL in your hosting deployment settings.`
        : `Could not connect to FastAPI server at ${url}. Please verify backend is running on http://localhost:8000.`;

      throw new Error(detail);
    }
    throw err;
  }
}

export const fetchAssets = async () => {
  return await apiFetch('/assets', {}, 'Failed to fetch supported assets.');
};

export const fetchRealtimePrediction = async (assetId) => {
  return await apiFetch(`/prediction/${assetId}`, {}, `Failed to fetch predictions for ${assetId}`);
};

export const postCustomPrediction = async (assetId, open, high, low, volume) => {
  return await apiFetch(
    '/prediction',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asset_id: assetId,
        Open: parseFloat(open),
        High: high ? parseFloat(high) : parseFloat(open),
        Low: low ? parseFloat(low) : parseFloat(open),
        Volume: volume ? parseFloat(volume) : 0.0,
      }),
    },
    'Custom prediction calculation failed.'
  );
};

export const fetchHistoricalData = async (assetId, limit = 100) => {
  return await apiFetch(`/historical/${assetId}?limit=${limit}`, {}, `Failed to fetch historical data for ${assetId}`);
};

export const fetchModelComparison = async (assetId) => {
  return await apiFetch(`/model-comparison/${assetId}`, {}, `Failed to fetch comparison metrics for ${assetId}`);
};

export const fetchHoldoutValidation = async (assetId, modelKey = 'svr') => {
  return await apiFetch(
    `/validation/holdout/${assetId}?model_key=${modelKey}`,
    {},
    `Failed to fetch holdout validation data for ${assetId}`
  );
};

export const fetchDailyWorkflow = async (assetId) => {
  return await apiFetch(
    `/prediction/daily-workflow/${assetId}`,
    {},
    `Failed to fetch daily workflow data for ${assetId}`
  );
};


