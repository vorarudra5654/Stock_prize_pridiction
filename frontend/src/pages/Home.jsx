import React from 'react';
import { Link } from '../router/RouterContext';
import { MODELS_LIST } from '../data/modelsData';
import ModelCard from '../components/ModelCard';
import WorkflowDiagram from '../components/WorkflowDiagram';
import DailyWorkflowCard from '../components/DailyWorkflowCard';
import MetricCard from '../components/MetricCard';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Cpu,
  Database,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

const Home = ({ assets = [], comparisonData }) => {
  return (
    <div className="home-page-container">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-pill-badge">
            <Sparkles size={14} className="sparkle-icon" />
            <span>AI-POWERED QUANTITATIVE PLATFORM</span>
          </div>

          <h1 className="hero-headline">
            Predict Stock Prices with Machine Learning
          </h1>

          <p className="hero-subtitle">
            Evaluate intraday market indicators, analyze historical time-series data, and generate data-driven daily closing price forecasts across six distinct regression algorithms.
          </p>

          <div className="hero-cta-group">
            <Link to="/models" className="btn btn-primary btn-lg">
              <span>Start Predicting</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/about" className="btn btn-secondary btn-lg">
              <BookOpen size={18} />
              <span>Explore Platform Architecture</span>
            </Link>
          </div>

          {/* Quick Metrics Overview Grid */}
          <div className="hero-metrics-grid">
            <MetricCard
              label="Available Regressors"
              value="6 ML Models"
              subtext="Linear, SVR, Trees & Boosting"
              icon={Cpu}
            />
            <MetricCard
              label="Supported Assets"
              value={`${assets.length || 3} Markets`}
              subtext="Reliance, Bitcoin, Google"
              icon={Database}
            />
            <MetricCard
              label="Validation Holdout"
              value="85 / 15 Split"
              subtext="Chronological Time-Series Test"
              icon={ShieldCheck}
            />
            <MetricCard
              label="Data Integration"
              value="Real-Time Sync"
              subtext="Live exchange price feeds"
              icon={TrendingUp}
            />
          </div>
        </div>
      </section>

      {/* 2. Platform Value Propositions / Key Pillars */}
      <section className="home-section">
        <div className="section-header-center">
          <span className="sub-badge">WHAT WE PROVIDE</span>
          <h2 className="section-main-title">Data-Driven Financial Intelligence</h2>
          <p className="section-main-desc">
            Combining rigorous statistical time-series methodology with real-time exchange data for transparent predictions.
          </p>
        </div>

        <div className="value-props-grid">
          <div className="value-card">
            <div className="value-icon-box">
              <BarChart3 size={22} />
            </div>
            <h3 className="value-title">Intraday Market Analysis</h3>
            <p className="value-desc">
              Synthesizes session Open, High, Low, and trading Volume data to capture market momentum and price volatility.
            </p>
          </div>

          <div className="value-card">
            <div className="value-icon-box">
              <Sliders size={22} />
            </div>
            <h3 className="value-title">Multi-Algorithm Comparison</h3>
            <p className="value-desc">
              Compare single-variable linear models against high-dimensional Support Vector Regression and decision tree ensembles.
            </p>
          </div>

          <div className="value-card">
            <div className="value-icon-box">
              <CheckCircle2 size={22} />
            </div>
            <h3 className="value-title">Holdout Out-of-Sample Testing</h3>
            <p className="value-desc">
              Every model is validated on unseen holdout test records with transparent R² accuracy scores and Mean Absolute Error (MAE).
            </p>
          </div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section className="home-section">
        <div className="section-header-center">
          <span className="sub-badge">SYSTEM PROCESS</span>
          <h2 className="section-main-title">How The Platform Works</h2>
          <p className="section-main-desc">
            A transparent four-step quantitative pipeline connecting live financial market feeds to trained machine learning models.
          </p>
        </div>

        <div className="how-it-works-grid">
          <div className="hiw-card">
            <div className="hiw-num">01</div>
            <h3 className="hiw-title">Market Data Feed</h3>
            <p className="hiw-desc">
              Connects to financial exchange APIs to retrieve real-time daily Open, High, Low, and Volume price records.
            </p>
          </div>
          <div className="hiw-card">
            <div className="hiw-num">02</div>
            <h3 className="hiw-title">Feature Engineering</h3>
            <p className="hiw-desc">
              Normalizes raw market inputs using StandardScaler and generates polynomial interaction terms where required.
            </p>
          </div>
          <div className="hiw-card">
            <div className="hiw-num">03</div>
            <h3 className="hiw-title">Multi-Model Inference</h3>
            <p className="hiw-desc">
              Executes predictions across 6 trained scikit-learn model pipelines simultaneously for comparative evaluation.
            </p>
          </div>
          <div className="hiw-card">
            <div className="hiw-num">04</div>
            <h3 className="hiw-title">Analytical Output</h3>
            <p className="hiw-desc">
              Displays estimated closing prices, directional price changes, and holdout R² validation accuracy metrics.
            </p>
          </div>
        </div>

        {/* Visual Pipeline Embed */}
        <div className="home-workflow-embed">
          <WorkflowDiagram title="End-to-End Market Prediction Pipeline" />
        </div>

        {/* Daily 3-Stage Market Prediction Lifecycle */}
        <div className="home-workflow-embed" style={{ marginTop: '24px' }}>
          <DailyWorkflowCard assetId="reliance" currency="INR" />
        </div>
      </section>

      {/* 4. Supported ML Models Portfolio Grid */}
      <section className="home-section">
        <div className="section-header-between">
          <div>
            <span className="sub-badge">ALGORITHM PORTFOLIO</span>
            <h2 className="section-main-title">Available Machine Learning Models</h2>
            <p className="section-main-desc">
              Select any model to execute live predictions or inspect detailed mathematical specifications.
            </p>
          </div>
          <Link to="/models" className="btn btn-outline btn-sm">
            <span>View Comparison Grid</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="models-cards-grid">
          {MODELS_LIST.map((model) => {
            const compMetric = comparisonData?.models?.find((m) => m.model_key === model.key);
            const isBest = model.key === comparisonData?.recommended_best_model;
            return (
              <ModelCard
                key={model.key}
                model={model}
                isRecommended={isBest}
                r2Score={compMetric?.r2_percentage}
                mae={compMetric?.mae}
                currency={comparisonData?.currency}
              />
            );
          })}
        </div>
      </section>

      {/* 5. Technology Stack Architecture */}
      <section className="home-section">
        <div className="section-header-center">
          <span className="sub-badge">ARCHITECTURE</span>
          <h2 className="section-main-title">Technology Stack</h2>
          <p className="section-main-desc">
            Built using modern, reliable open-source frameworks for high performance and strict quantitative reproducibility.
          </p>
        </div>

        <div className="tech-stack-grid">
          <div className="tech-card">
            <div className="tech-card-top">
              <div className="tech-icon-box">UI</div>
              <span className="tech-category-pill">Frontend</span>
            </div>
            <h4 className="tech-card-title">Vite & React 19</h4>
            <p className="tech-card-desc">Modern single-page client interface built with custom CSS design tokens.</p>
          </div>

          <div className="tech-card">
            <div className="tech-card-top">
              <div className="tech-icon-box">API</div>
              <span className="tech-category-pill">Backend</span>
            </div>
            <h4 className="tech-card-title">FastAPI Microservice</h4>
            <p className="tech-card-desc">High-speed asynchronous Python REST API serving trained model artifacts.</p>
          </div>

          <div className="tech-card">
            <div className="tech-card-top">
              <div className="tech-icon-box">ML</div>
              <span className="tech-category-pill">Intelligence</span>
            </div>
            <h4 className="tech-card-title">Scikit-Learn ML</h4>
            <p className="tech-card-desc">Standardized pipelines for Linear Regression, SVR, Random Forest, and Gradient Boosting.</p>
          </div>

          <div className="tech-card">
            <div className="tech-card-top">
              <div className="tech-icon-box">DATA</div>
              <span className="tech-category-pill">Visuals</span>
            </div>
            <h4 className="tech-card-title">Lightweight Charts & Recharts</h4>
            <p className="tech-card-desc">Interactive TradingView financial charts and holdout accuracy benchmark visuals.</p>
          </div>
        </div>
      </section>

      {/* 6. Call To Action Section */}
      <section className="home-section bottom-cta-banner">
        <div className="cta-banner-content">
          <h2 className="cta-title">Ready to Explore Stock Price Predictions?</h2>
          <p className="cta-desc">
            Choose any algorithm to test real-time predictions, analyze custom what-if market scenarios, or inspect algorithm specifications.
          </p>
          <div className="cta-buttons-wrapper">
            <Link to="/models" className="btn btn-primary btn-lg">
              <span>Start Predicting Now</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/about" className="btn btn-secondary btn-lg">
              <BookOpen size={18} />
              <span>Read Documentation</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
