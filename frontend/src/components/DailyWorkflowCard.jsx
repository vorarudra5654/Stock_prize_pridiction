import React, { useState, useEffect } from 'react';
import { fetchDailyWorkflow } from '../services/api';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { Sun, Moon, CheckCircle2, ArrowRight, Activity, Award, BarChart3 } from 'lucide-react';

const DailyWorkflowCard = ({ assetId = 'reliance', currency = 'INR' }) => {
  const [workflowData, setWorkflowData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchDailyWorkflow(assetId)
      .then((data) => {
        if (isMounted) {
          setWorkflowData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Daily workflow fetch error:', err);
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [assetId]);

  if (loading) {
    return (
      <div className="daily-workflow-card glass-panel loading-state">
        <div className="pulse-loader"></div>
        <p>Loading Daily Forecasting Lifecycle...</p>
      </div>
    );
  }

  if (!workflowData || !workflowData.lifecycle_stages) {
    return null;
  }

  const stages = workflowData.lifecycle_stages;
  const summary = workflowData.summary || {};

  return (
    <div className="daily-workflow-card glass-panel">
      <div className="workflow-card-header">
        <div className="header-left">
          <span className="sub-badge">AUTOMATED DAILY LIFECYCLE</span>
          <h3 className="card-title">Daily Market Prediction & Evaluation Pipeline</h3>
          <p className="card-subtitle">
            Sequential 3-stage forecasting workflow linking evening market settlement to morning open predictions and intraday close validation.
          </p>
        </div>
        <div className="asset-pill-badge">
          <Activity size={14} />
          <span>{workflowData.asset_name} ({currency})</span>
        </div>
      </div>

      {/* Visual 3-Stage Stepper Flow */}
      <div className="daily-stages-grid">
        {/* Stage 1: Evening Market Closed -> Predict Open */}
        <div className="stage-step-card stage-evening">
          <div className="stage-card-top">
            <div className="stage-icon-box evening-icon">
              <Moon size={18} />
            </div>
            <span className="stage-number">STAGE 01</span>
          </div>

          <div className="stage-timing-tag">EVENING / MARKET CLOSED</div>
          <h4 className="stage-title">Predict Tomorrow's Open</h4>
          <p className="stage-desc">
            Today's completed session data is processed to forecast next morning's opening price.
          </p>

          <div className="stage-result-box">
            <span className="result-label">Tomorrow's Predicted Open</span>
            <span className="result-value">
              {formatCurrency(summary.predicted_next_open || stages[0]?.predicted_value, currency)}
            </span>
          </div>
        </div>

        <div className="workflow-stage-connector">
          <ArrowRight size={20} />
        </div>

        {/* Stage 2: Next Morning Market Opens -> Predict Close */}
        <div className="stage-step-card stage-morning">
          <div className="stage-card-top">
            <div className="stage-icon-box morning-icon">
              <Sun size={18} />
            </div>
            <span className="stage-number">STAGE 02</span>
          </div>

          <div className="stage-timing-tag">NEXT MORNING / MARKET OPENS</div>
          <h4 className="stage-title">Predict Tomorrow's Close</h4>
          <p className="stage-desc">
            Actual morning opening price becomes available and is fed into all 6 ML regression models.
          </p>

          <div className="stage-result-box">
            <span className="result-label">Tomorrow's Predicted Close</span>
            <span className="result-value highlight">
              {formatCurrency(summary.predicted_next_close || stages[1]?.predicted_value, currency)}
            </span>
            <span className="model-subtag">
              <Award size={11} /> {summary.best_model_used || 'SVR Model'}
            </span>
          </div>
        </div>

        <div className="workflow-stage-connector">
          <ArrowRight size={20} />
        </div>

        {/* Stage 3: Market Closes -> Evaluation */}
        <div className="stage-step-card stage-eval">
          <div className="stage-card-top">
            <div className="stage-icon-box eval-icon">
              <BarChart3 size={18} />
            </div>
            <span className="stage-number">STAGE 03</span>
          </div>

          <div className="stage-timing-tag">MARKET CLOSES / EVALUATION</div>
          <h4 className="stage-title">Compare Predicted vs Actual</h4>
          <p className="stage-desc">
            Trading session finishes. Actual closing price is evaluated against ML model predictions.
          </p>

          <div className="stage-result-box eval-box">
            <div className="eval-metric-row">
              <span>Actual Open Ref:</span>
              <strong>{formatCurrency(stages[2]?.actual_close, currency)}</strong>
            </div>
            <div className="eval-metric-row">
              <span>Predicted Close:</span>
              <strong>{formatCurrency(stages[2]?.predicted_close, currency)}</strong>
            </div>
            <div className="eval-metric-row highlight-row">
              <span>Accuracy Diff:</span>
              <strong>
                {formatCurrency(stages[2]?.difference, currency)} ({formatPercent(stages[2]?.error_percentage)})
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyWorkflowCard;
