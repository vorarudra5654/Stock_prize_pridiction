export const MODELS_LIST = [
  {
    key: 'linear',
    slug: 'linear-regression',
    name: 'Simple Linear Regression',
    category: 'Single-Variable Linear',
    shortDesc: 'Predicts closing stock price using a basic single-variable linear relationship with Opening price.',
    iconName: 'TrendingUp',
    formula: 'Close = β₀ + β₁(Open)',
    formulaDisplay: 'Close = β₀ + β₁ · Open',
    features: ['Open'],
    featuresExplanation: [
      { name: 'Open', desc: 'Opening market price at session start' }
    ],
    whatIs: 'Simple Linear Regression is a foundational statistical machine learning algorithm that estimates a direct linear relationship between a single input feature (Opening Price) and the target variable (Next Day Closing Price). It assumes that changes in closing price move proportionally with opening price.',
    howItWorks: [
      { step: 1, title: 'Historical Data Ingestion', desc: 'Fetches historical daily market records (Open, Close).' },
      { step: 2, title: 'Feature Isolation', desc: 'Extracts the single predictor variable (Open price).' },
      { step: 3, title: 'OLS Optimization', desc: 'Applies Ordinary Least Squares to calculate optimal slope and intercept values.' },
      { step: 4, title: 'Pattern Learning', desc: 'Establishes linear coefficient relationship b₁ between Open and Close.' },
      { step: 5, title: 'Real-Time Evaluation', desc: 'Evaluates new real-time Open price input through linear equation.' },
      { step: 6, title: 'Prediction Output', desc: 'Generates estimated closing price prediction.' }
    ],
    mathConcept: {
      equation: 'Close = β₀ + β₁ · Open',
      latex: '\\hat{y} = \\beta_0 + \\beta_1 x_1',
      terms: [
        { symbol: 'ŷ (Close)', desc: 'Predicted next day closing price.' },
        { symbol: 'β₀', desc: 'Y-intercept constant representing baseline value when Open is zero.' },
        { symbol: 'β₁', desc: 'Regression slope coefficient representing price change per unit change in Open.' },
        { symbol: 'x₁ (Open)', desc: 'Input market opening price.' }
      ]
    },
    trainingProcess: {
      split: '85% Training Data / 15% Chronological Test Holdout',
      preprocessing: 'Raw numerical extraction without scaling (preserves direct price units)',
      algorithm: 'Scikit-Learn LinearRegression using Ordinary Least Squares (OLS)',
      validation: 'Evaluated on unseen historical test records to measure out-of-sample error'
    },
    metrics: {
      mae: 'Mean Absolute Error: Average dollar difference between predicted and actual close prices.',
      rmse: 'Root Mean Squared Error: Penalizes larger prediction deviations heavier than smaller ones.',
      r2: 'R² Score (Coefficient of Determination): Measures percentage of price variance explained by Open price.',
      mape: 'Mean Absolute Percentage Error: Relative accuracy in percentage terms.'
    },
    advantages: [
      'Extremely fast computation and zero memory overhead',
      '100% interpretable model coefficients with clear financial meaning',
      'Serves as an essential baseline benchmark for evaluating complex models'
    ],
    limitations: [
      'Fails to capture complex market dynamics, volatility spikes, or momentum',
      'Ignores crucial market indicators such as intraday High, Low, and Volume',
      'Cannot model non-linear trend curves or market trend reversals'
    ]
  },
  {
    key: 'multiple_linear',
    slug: 'multiple-linear-regression',
    name: 'Multiple Linear Regression',
    category: 'Multivariate Linear',
    shortDesc: 'Extends linear regression into multi-dimensional space, analyzing Open, High, Low, and Volume simultaneously.',
    iconName: 'Layers',
    formula: 'Close = β₀ + β₁(Open) + β₂(High) + β₃(Low) + β₄(Volume)',
    formulaDisplay: 'Close = β₀ + β₁(Open) + β₂(High) + β₃(Low) + β₄(Volume)',
    features: ['Open', 'High', 'Low', 'Volume'],
    featuresExplanation: [
      { name: 'Open', desc: 'Session opening price' },
      { name: 'High', desc: 'Intraday peak transaction price' },
      { name: 'Low', desc: 'Intraday lowest transaction price' },
      { name: 'Volume', desc: 'Total number of shares/units traded during session' }
    ],
    whatIs: 'Multiple Linear Regression is a multivariate statistical model that estimates closing prices by evaluating multiple market variables at once. It fits a 4-dimensional hyperplane through feature space, giving unique weight coefficients to Open price, intraday High, Low, and trading Volume.',
    howItWorks: [
      { step: 1, title: 'Multi-Feature Matrix Assembly', desc: 'Extracts Open, High, Low, and Volume into feature matrix X.' },
      { step: 2, title: 'Matrix Normalization', desc: 'Standardizes scale differences between prices and volume.' },
      { step: 3, title: 'Weight Optimization', desc: 'Solves normal equations to compute coefficient vector beta.' },
      { step: 4, title: 'Multi-Dimensional Learning', desc: 'Learns combined influence of intraday volatility and liquidity.' },
      { step: 5, title: 'Real-Time Data Vector Ingestion', desc: 'Ingests live Open, High, Low, and Volume values.' },
      { step: 6, title: 'Hyperplane Inference', desc: 'Computes weighted linear dot-product for final prediction.' }
    ],
    mathConcept: {
      equation: 'Close = β₀ + β₁(Open) + β₂(High) + β₃(Low) + β₄(Volume)',
      latex: '\\hat{y} = \\beta_0 + \\beta_1 x_1 + \\beta_2 x_2 + \\beta_3 x_3 + \\beta_4 x_4',
      terms: [
        { symbol: 'ŷ (Close)', desc: 'Predicted closing price.' },
        { symbol: 'β₀', desc: 'Regression constant intercept.' },
        { symbol: 'β₁, β₂, β₃, β₄', desc: 'Linear weight coefficients assigned to Open, High, Low, and Volume.' },
        { symbol: 'x₁, x₂, x₃, x₄', desc: 'Standardized input feature values.' }
      ]
    },
    trainingProcess: {
      split: '85% Historical Training / 15% Test Split',
      preprocessing: 'StandardScaler feature normalization matrix',
      algorithm: 'Scikit-Learn LinearRegression with multivariate OLS solver',
      validation: 'Cross-validated on chronological time-series holdout test set'
    },
    metrics: {
      mae: 'MAE: Average magnitude of prediction error across all test sessions.',
      rmse: 'RMSE: Standard deviation of prediction residuals.',
      r2: 'R² Score: Proportion of closing price variance explained by all 4 features combined.',
      mape: 'MAPE: Mean percentage divergence from actual close.'
    },
    advantages: [
      'Incorporate intraday price range (High vs Low) and trading activity volume',
      'Provides clear insight into which feature (e.g. High vs Volume) has highest predictive weight',
      'Significantly higher predictive accuracy than single-variable regression'
    ],
    limitations: [
      'Susceptible to multicollinearity between High and Low price columns',
      'Assumes linear boundary relationships between features and target price'
    ]
  },
  {
    key: 'polynomial',
    slug: 'polynomial-regression',
    name: 'Polynomial Regression (Degree 3)',
    category: 'Non-Linear Transformation',
    shortDesc: 'Models non-linear price curvature and acceleration by generating cubic polynomial feature transformations.',
    iconName: 'Activity',
    formula: 'Close = β₀ + ∑ βᵢ·Xᵢ + ∑ βᵢⱼ·(XᵢXⱼ) + ∑ βᵢⱼₖ·(XᵢXⱼXₖ)',
    formulaDisplay: 'Close = β₀ + β₁·X + β₂·X² + β₃·X³ + ∑ βᵢⱼ(XᵢXⱼ) + ∑ βᵢⱼₖ(XᵢXⱼXₖ)',
    features: ['Open', 'High', 'Low', 'Volume'],
    featuresExplanation: [
      { name: 'Open, High, Low, Volume', desc: 'Raw market features expanded into degree-3 quadratic and cubic interaction terms.' }
    ],
    whatIs: 'Polynomial Regression is an extension of linear regression that models non-linear relationships by creating higher-order polynomial features (quadratic x² and cubic x³ terms, plus interaction cross-products) before applying linear fitting. This allows the model to capture parabolic trend curves and price acceleration.',
    howItWorks: [
      { step: 1, title: 'Raw Feature Extraction', desc: 'Receives standard market features (Open, High, Low, Volume).' },
      { step: 2, title: 'Polynomial Feature Expansion', desc: 'Generates cubic terms (x³, x₁x₂, etc.) using PolynomialFeatures(degree=3).' },
      { step: 3, title: 'Standardization Pipeline', desc: 'Scales high-magnitude polynomial features using StandardScaler.' },
      { step: 4, title: 'Curved Surface Fitting', desc: 'Fits linear regression weights to expanded polynomial space.' },
      { step: 5, title: 'Market Input Transformation', desc: 'Transforms live market input into degree 3 polynomial space.' },
      { step: 6, title: 'Curved Estimation', desc: 'Outputs non-linear predicted closing price.' }
    ],
    mathConcept: {
      equation: 'Close = β₀ + ∑ᵢ₌₁⁴ βᵢ·Xᵢ + ∑ᵢ,ⱼ βᵢⱼ·XᵢXⱼ + ∑ᵢ,ⱼ,ₖ βᵢⱼₖ·XᵢXⱼXₖ',
      latex: '\\hat{y} = \\beta_0 + \\sum_{i=1}^{p} \\beta_i x_i + \\sum_{i \\le j} \\beta_{ij} x_i x_j + \\sum_{i \\le j \\le k} \\beta_{ijk} x_i x_j x_k',
      terms: [
        { symbol: 'ŷ (Close)', desc: 'Non-linear predicted closing price.' },
        { symbol: 'Xᵢ', desc: 'Primary linear feature vector (Open, High, Low, Volume).' },
        { symbol: 'Xᵢ² , Xᵢ³', desc: 'Quadratic and cubic terms capturing price curvature and trend acceleration.' },
        { symbol: 'Xᵢ·Xⱼ', desc: 'Pairwise feature interaction terms modeling cross-market volatility effects.' },
        { symbol: 'βᵢ , βᵢⱼ , βᵢⱼₖ', desc: 'Learned polynomial weight coefficients.' }
      ]
    },
    trainingProcess: {
      split: '85% Train / 15% Test Chronological Split',
      preprocessing: 'PolynomialFeatures(degree=3, include_bias=False) -> StandardScaler()',
      algorithm: 'Scikit-Learn Pipeline combining Polynomial Transformation and OLS Regressor',
      validation: 'Holdout test evaluation for non-linear generalization'
    },
    metrics: {
      mae: 'MAE: Measures precision of curved model estimates.',
      rmse: 'RMSE: Highlights performance under non-linear market swings.',
      r2: 'R² Score: Fits complex trend curves with exceptionally high R² scores on structured data.',
      mape: 'MAPE: Percentage accuracy metric.'
    },
    advantages: [
      'Effectively captures curved price momentum and acceleration trends',
      'Maintains linear regression optimization efficiency while learning non-linear curves',
      'Achieves top-tier training fit on smooth market trends'
    ],
    limitations: [
      'High polynomial degrees (degree > 3) can overfit to noisy price fluctuations',
      'Extreme feature values outside training range can cause polynomial extrapolation blowups'
    ]
  },
  {
    key: 'svr',
    slug: 'svr',
    name: 'Support Vector Regression (SVR - RBF)',
    category: 'Kernel Machine Learning',
    shortDesc: 'Uses Radial Basis Function (RBF) kernel mapping to fit an epsilon-margin prediction tube around complex market trends.',
    iconName: 'Shield',
    formula: 'f(x) = ∑ᵢ (αᵢ - αᵢ*) · K(xᵢ, x) + b',
    formulaDisplay: 'f(x) = ∑ᵢ ∈ SV (αᵢ - αᵢ*) · exp(-γ ||xᵢ - x||²) + b',
    features: ['Open', 'High', 'Low', 'Volume'],
    featuresExplanation: [
      { name: 'Open, High, Low, Volume', desc: 'Scaled market features projected into infinite-dimensional Hilbert feature space.' }
    ],
    whatIs: 'Support Vector Regression (SVR) is a powerful kernel-based machine learning algorithm. Unlike standard regression that minimizes squared error, SVR fits an optimal decision boundary (a hyperplane in high-dimensional space) within an ε-insensitive margin tube where errors below ε are ignored, making it highly resilient to market outliers.',
    howItWorks: [
      { step: 1, title: 'Feature Scaling', desc: 'Scales Open, High, Low, Volume to zero mean and unit variance.' },
      { step: 2, title: 'RBF Kernel Transformation', desc: 'Maps feature vectors into infinite-dimensional space using Radial Basis Function.' },
      { step: 3, title: 'Margin Tube Fitting', desc: 'Constructs an ε-insensitive margin tube (ε=0.1) around historical data.' },
      { step: 4, title: 'Support Vector Selection', desc: 'Identifies key market boundary points (Support Vectors) defining the tube.' },
      { step: 5, title: 'Real-Time Kernel Projection', desc: 'Projects incoming live market record against support vectors.' },
      { step: 6, title: 'Robust Price Prediction', desc: 'Outputs final predicted closing price.' }
    ],
    mathConcept: {
      equation: 'f(x) = ∑ᵢ ∈ SV (αᵢ - αᵢ*) · exp(-γ ||xᵢ - x||²) + b',
      latex: 'f(\\mathbf{x}) = \\sum_{i \\in \\text{SV}} (\\alpha_i - \\alpha_i^*) \\exp\\left(-\\gamma \\|\\mathbf{x}_i - \\mathbf{x}\\|^2\\right) + b',
      terms: [
        { symbol: 'f(x)', desc: 'SVR predicted closing price value.' },
        { symbol: 'K(xᵢ, x)', desc: 'Radial Basis Function (RBF) Gaussian kernel function measuring similarity between feature vectors.' },
        { symbol: 'αᵢ , αᵢ*', desc: 'Lagrange multipliers obtained via dual quadratic optimization.' },
        { symbol: 'γ (gamma)', desc: 'RBF kernel scale parameter governing decision boundary influence width.' },
        { symbol: 'ε (epsilon)', desc: 'Insensitivity threshold (ε = 0.1) where prediction errors within tube incur zero penalty.' },
        { symbol: 'b', desc: 'Bias intercept term of the support vector decision boundary.' }
      ]
    },
    trainingProcess: {
      split: '85% Historical Training / 15% Test Split',
      preprocessing: 'StandardScaler normalization for kernel distance calculation',
      algorithm: 'Scikit-Learn SVR(kernel="rbf", C=100.0, gamma="scale", epsilon=0.1)',
      validation: 'Evaluated on chronological holdout data'
    },
    metrics: {
      mae: 'MAE: Measures prediction precision inside and outside the margin tube.',
      rmse: 'RMSE: Evaluates outlier impact.',
      r2: 'R² Score: Excellent out-of-sample R² accuracy due to regularized margin bounds.',
      mape: 'MAPE: Percentage error magnitude.'
    },
    advantages: [
      'Highly resistant to random market noise and outlier spikes due to the ε-tube',
      'Learns intricate non-linear decision boundaries using RBF kernel mapping',
      'Guarantees global optimum convergence via convex quadratic programming'
    ],
    limitations: [
      'Computationally intensive on large time-series datasets',
      'Requires strict feature scaling (highly sensitive to unscaled Volume values)'
    ]
  },
  {
    key: 'random_forest',
    slug: 'random-forest',
    name: 'Random Forest Regressor',
    category: 'Ensemble Learning',
    shortDesc: 'Averages predictions across an ensemble of 100 independent decision trees trained on bootstrap data samples.',
    iconName: 'Trees',
    formula: 'Close = (1 / N) · ∑ᵢ₌₁ᴺ Tᵢ(Open, High, Low, Volume)',
    formulaDisplay: 'Close = (1 / N) · ∑ᵢ₌₁ᴺ Tᵢ(x)  [where N = 100 Trees]',
    features: ['Open', 'High', 'Low', 'Volume'],
    featuresExplanation: [
      { name: 'Open, High, Low, Volume', desc: 'Input features evaluated across multiple random decision splits in parallel decision trees.' }
    ],
    whatIs: 'Random Forest Regressor is an ensemble learning method that builds a "forest" of 100 decision trees using bootstrap aggregation (bagging). Each decision tree evaluates random subsets of market features and data samples, and the final stock price prediction is computed as the average output across all 100 trees.',
    howItWorks: [
      { step: 1, title: 'Bootstrap Subsampling', desc: 'Generates 100 randomized training sub-datasets from historical market data.' },
      { step: 2, title: 'Decision Tree Construction', desc: 'Builds 100 independent decision trees with max depth 10.' },
      { step: 3, title: 'Random Feature Selection', desc: 'Selects random subsets of Open, High, Low, Volume at each node split.' },
      { step: 4, title: 'Parallel Tree Training', desc: 'Trains trees in parallel to minimize variance without overfitting.' },
      { step: 5, title: 'Multi-Tree Inference', desc: 'Passes live market record through all 100 decision trees.' },
      { step: 6, title: 'Ensemble Averaging', desc: 'Averages tree predictions to produce final robust closing price.' }
    ],
    mathConcept: {
      equation: 'Close = (1 / N) · ∑ᵢ₌₁ᴺ Tᵢ(Open, High, Low, Volume)',
      latex: '\\hat{y} = \\frac{1}{N} \\sum_{i=1}^{N} T_i(\\mathbf{x}) \\quad \\text{where } N = 100',
      terms: [
        { symbol: 'ŷ (Close)', desc: 'Final ensemble predicted closing price aggregated across all decision trees.' },
        { symbol: 'N = 100', desc: 'Number of individual decision trees in the ensemble.' },
        { symbol: 'Tᵢ(x)', desc: 'Predicted price output of the i-th decision tree.' },
        { symbol: 'x', desc: 'Input feature vector (Open, High, Low, Volume).' }
      ]
    },
    trainingProcess: {
      split: '85% Train / 15% Test Split',
      preprocessing: 'StandardScaler pipeline + Bootstrap feature subset selection',
      algorithm: 'Scikit-Learn RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)',
      validation: 'Evaluated on out-of-bag samples and chronological test split'
    },
    metrics: {
      mae: 'MAE: Measures average ensemble residual error.',
      rmse: 'RMSE: Assesses performance across diverse market volatility regimes.',
      r2: 'R² Score: High generalization R² score due to variance reduction from bagging.',
      mape: 'MAPE: Relative prediction accuracy percentage.'
    },
    advantages: [
      'Handles complex non-linear relationships without rigid parametric assumptions',
      'Extremely resistant to overfitting on single-session anomalies due to ensemble bagging',
      'Provides implicit feature importance rankings across market variables'
    ],
    limitations: [
      'Cannot extrapolate price predictions beyond the minimum and maximum historical training bounds',
      'Slightly larger model payload file size compared to simple linear equations'
    ]
  },
  {
    key: 'gradient_boosting',
    slug: 'gradient-boosting',
    aliasSlugs: ['gradient-descent'],
    name: 'Gradient Boosting Regressor',
    category: 'Boosting Ensemble',
    shortDesc: 'Sequentially builds decision trees where each new tree specifically corrects the residual errors of prior trees.',
    iconName: 'Zap',
    formula: 'Fₘ(x) = Fₘ₋₁(x) + ν · γₘ · hₘ(x)',
    formulaDisplay: 'F_M(x) = F₀(x) + ν · ∑ₘ₌₁ᴹ γₘ · hₘ(x)  [where M = 100 Stages, ν = 0.1]',
    features: ['Open', 'High', 'Low', 'Volume'],
    featuresExplanation: [
      { name: 'Open, High, Low, Volume', desc: 'Features evaluated sequentially to minimize residual prediction loss gradient.' }
    ],
    whatIs: 'Gradient Boosting Regressor is a state-of-the-art sequential ensemble model. Unlike Random Forest (which builds trees independently in parallel), Gradient Boosting builds decision trees sequentially. Each new tree focuses explicitly on predicting the residual errors (pseudo-residuals) left behind by previous trees, progressively minimizing overall prediction loss.',
    howItWorks: [
      { step: 1, title: 'Initial Constant Prediction', desc: 'Initializes model with constant mean target prediction value F₀(x).' },
      { step: 2, title: 'Residual Error Computation', desc: 'Calculates exact difference (residual = actual - predicted) for every session.' },
      { step: 3, title: 'Weak Learner Fitting', desc: 'Trains a shallow decision tree (depth 5) on current residual errors.' },
      { step: 4, title: 'Learning Rate Scaling', desc: 'Scales tree contribution using learning rate factor (lr = 0.1).' },
      { step: 5, title: 'Sequential Model Update', desc: 'Adds new tree to cumulative model and repeats for 100 boosting stages.' },
      { step: 6, title: 'Boosted Prediction Output', desc: 'Summates predictions from all 100 boosted stages for final output.' }
    ],
    mathConcept: {
      equation: 'F_m(x) = F_{m-1}(x) + ν · γ_m h_m(Open, High, Low, Volume)',
      latex: 'F_m(\\mathbf{x}) = F_{m-1}(\\mathbf{x}) + \\nu \\cdot \\gamma_m h_m(\\mathbf{x}) \\quad (h_m \\approx -\\nabla L)',
      terms: [
        { symbol: 'F_m(x)', desc: 'Ensemble model prediction after m boosting stages.' },
        { symbol: 'F_{m-1}(x)', desc: 'Combined prediction of all previous m-1 stages.' },
        { symbol: 'h_m(x)', desc: 'New decision tree fitted to negative loss function gradient (residuals).' },
        { symbol: 'ν = 0.1', desc: 'Learning rate shrinkage factor preventing overshooting.' },
        { symbol: 'γ_m', desc: 'Optimal step length multiplier for stage m.' }
      ]
    },
    trainingProcess: {
      split: '85% Training / 15% Holdout Test Split',
      preprocessing: 'StandardScaler feature scaling + Gradient Descent optimization',
      algorithm: 'Scikit-Learn GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=5)',
      validation: 'Holdout test evaluation'
    },
    metrics: {
      mae: 'MAE: Exceptional precision on complex financial patterns.',
      rmse: 'RMSE: Low root mean squared error.',
      r2: 'R² Score: High predictive validation score.',
      mape: 'MAPE: Percentage error magnitude.'
    },
    advantages: [
      'Delivers top-tier predictive accuracy on tabular time-series market datasets',
      'Fine-tunes decision tree splits specifically on historical forecasting errors',
      'Captures subtle non-linear dependencies between Volume spikes and intraday High/Low bounds'
    ],
    limitations: [
      'Sensitive to extreme noisy outliers if learning rate or tree depth is configured too high',
      'Sequential training requires careful hyperparameter tuning'
    ]
  }
];

export const getModelBySlug = (slugOrKey) => {
  if (!slugOrKey) return MODELS_LIST[0];
  const clean = slugOrKey.toLowerCase().trim();
  const found = MODELS_LIST.find(
    (m) =>
      m.slug === clean ||
      m.key === clean ||
      (m.aliasSlugs && m.aliasSlugs.includes(clean))
  );
  return found || MODELS_LIST[0];
};
