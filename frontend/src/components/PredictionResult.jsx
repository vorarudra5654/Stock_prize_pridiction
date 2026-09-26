import React from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Award,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Clock,
  CalendarOff,
  CheckCheck,
  Calendar,
  Globe
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';

const PredictionResult = ({
  modelKey,
  modelName,
  predictionData,
  currency = 'USD',
  loading = false,
  error = null,
}) => {
  const todayDateStr = predictionData?.timestamp || predictionData?.date || new Date().toISOString().substring(0, 10);
  const timezoneStr = predictionData?.timezone || '';

  const formattedTodayDate = React.useMemo(() => {
    try {
      const d = new Date(todayDateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return todayDateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return todayDateStr;
    }
  }, [todayDateStr]);

  if (loading) {
    return (
      <div className="prediction-result-card loading-state">
        <Loader2 size={36} className="spinner loading-icon" />
        <h4>Calculating ML Model Inference...</h4>
        <p>Processing feature engineering pipeline and executing model evaluation.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prediction-result-card error-state">
        <AlertCircle size={32} className="error-icon" />
        <h4>Prediction Calculation Error</h4>
        <p>{error}</p>
      </div>
    );
  }

  if (!predictionData) return null;

  const marketStatus = predictionData.market_status || 'open';
  const predictionStatus = predictionData.prediction_status || 'active';
  const statusMessage = predictionData.message || '';

  // Non-trading day state (Weekend or Market Holiday)
  if (marketStatus === 'closed_weekend_holiday') {
    return (
      <div className="prediction-result-card info-state">
        <div className="result-header">
          <div>
            <span className="result-badge warning">Market Closed</span>
            <h2 className="result-model-name">{modelName}</h2>
          </div>
          <div className="status-banner-pill">
            <CalendarOff size={16} /> Non-Trading Day
          </div>
        </div>

        {/* Current Date Banner */}
        <div className="result-today-date-row">
          <div className="today-date-badge font-mono">
            <Calendar size={14} />
            <span>Current Market Date: <strong>{formattedTodayDate}</strong> ({todayDateStr})</span>
            {timezoneStr && (
              <span className="tz-tag">
                <Globe size={11} /> {timezoneStr}
              </span>
            )}
          </div>
        </div>

        <div className="market-status-body">
          <p className="status-msg-main">{statusMessage}</p>
          <p className="status-msg-sub">
            No live Close price prediction is generated on weekends or market holidays. Predictions resume at market open on the next trading day.
          </p>
        </div>
      </div>
    );
  }

  // Before Market Open state (Trading Day, before opening bell)
  if (marketStatus === 'before_open') {
    return (
      <div className="prediction-result-card info-state">
        <div className="result-header">
          <div>
            <span className="result-badge info">Before Market Open</span>
            <h2 className="result-model-name">{modelName}</h2>
          </div>
          <div className="status-banner-pill info">
            <Clock size={16} /> Waiting for Open
          </div>
        </div>

        {/* Current Date Banner */}
        <div className="result-today-date-row">
          <div className="today-date-badge font-mono">
            <Calendar size={14} />
            <span>Current Market Date: <strong>{formattedTodayDate}</strong> ({todayDateStr})</span>
            {timezoneStr && (
              <span className="tz-tag">
                <Globe size={11} /> {timezoneStr}
              </span>
            )}
          </div>
        </div>

        <div className="market-status-body">
          <p className="status-msg-main">{statusMessage}</p>
          <p className="status-msg-sub">
            Today's actual opening price is not available yet. The ML model will automatically calculate today's Close prediction as soon as the opening bell rings.
          </p>
        </div>
      </div>
    );
  }

  const pred = predictionData.predictions?.[modelKey];
  if (!pred) return null;

  const isRecommended = predictionData.recommended_best_model === modelKey;
  const isPositive = pred.diff_from_open > 0;
  const isNegative = pred.diff_from_open < 0;

  return (
    <div className={`prediction-result-card success-state ${isRecommended ? 'recommended-card' : ''}`}>
      {isRecommended && (
        <div className="result-recommended-banner">
          <Award size={15} /> Validated Best Recommended Model
        </div>
      )}

      <div className="result-header">
        <div>
          <span className="result-badge">
            {predictionStatus === 'completed' ? 'Session Evaluated' : 'Today\'s Prediction'}
          </span>
          <h2 className="result-model-name">{pred.model_name || modelName}</h2>
        </div>
        <div className="result-features-pill">
          Features: {pred.features_used?.join(', ')}
        </div>
      </div>

      {/* Current Date Banner */}
      <div className="result-today-date-row">
        <div className="today-date-badge font-mono">
          <Calendar size={14} />
          <span>Current Market Date: <strong>{formattedTodayDate}</strong> ({todayDateStr})</span>
          {timezoneStr && (
            <span className="tz-tag">
              <Globe size={11} /> {timezoneStr}
            </span>
          )}
        </div>
      </div>

      <div className="result-main-display">
        <div className="predicted-price-block">
          <span className="price-label">Today's Predicted Close Price</span>
          <div className="price-value-row">
            <span className="price-number">
              {formatCurrency(pred.predicted_close, currency)}
            </span>
            <Sparkles size={20} className="sparkle-icon" />
          </div>
        </div>

        <div className="price-change-block">
          <span className="change-label">Estimated Direction vs Open</span>
          <div className={`change-pill ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
            {isPositive && <ArrowUpRight size={18} />}
            {isNegative && <ArrowDownRight size={18} />}
            {!isPositive && !isNegative && <Minus size={18} />}
            <span className="change-amount">
              {isPositive ? '+' : ''}
              {formatCurrency(pred.diff_from_open, currency)}
            </span>
            <span className="change-percentage">({formatPercent(pred.percentage_diff)})</span>
          </div>
        </div>
      </div>

      <div className="result-meta-row">
        <div className="meta-item">
          <span className="meta-label">Today's Actual Open</span>
          <span className="meta-val">{formatCurrency(pred.open_price, currency)}</span>
        </div>

        {pred.actual_close !== null && pred.actual_close !== undefined && (
          <div className="meta-item">
            <span className="meta-label">Today's Actual Close</span>
            <span className="meta-val highlight">{formatCurrency(pred.actual_close, currency)}</span>
          </div>
        )}

        {pred.prediction_error !== null && pred.prediction_error !== undefined && (
          <div className="meta-item">
            <span className="meta-label">Prediction Error</span>
            <span className="meta-val">{formatCurrency(pred.prediction_error, currency)}</span>
          </div>
        )}

        <div className="meta-item">
          <span className="meta-label">Prediction Status</span>
          <span className="meta-status">
            {predictionStatus === 'completed' ? (
              <>
                <CheckCheck size={13} className="success-icon" /> Session Completed & Evaluated
              </>
            ) : (
              <>
                <CheckCircle2 size={13} className="success-icon" /> Active Today's Prediction
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PredictionResult;

