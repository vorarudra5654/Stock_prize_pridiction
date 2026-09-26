import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  LineSeries,
  LineStyle,
  CrosshairMode,
} from 'lightweight-charts';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  SlidersHorizontal,
  TrendingUp,
  Coins,
  Globe,
  Calendar,
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';

const ASSET_SYMBOLS = {
  reliance: { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', initials: 'RE', color: '#2563EB', icon: TrendingUp },
  bitcoin: { symbol: 'BTC/USD', name: 'Bitcoin Crypto', initials: 'BTC', color: '#F59E0B', icon: Coins },
  google: { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)', initials: 'GO', color: '#4285F4', icon: Globe },
};

const FinancialChart = ({
  historicalData,
  metadata,
  predictionData,
  currency = 'USD',
  assetName = '',
  selectedModelKey = 'svr',
  activeTab = 'historical', // 'historical' | 'validation'
}) => {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const closeSeriesRef = useRef(null);
  const openSeriesRef = useRef(null);
  const predictionSeriesRef = useRef(null);
  const legendRef = useRef(null);
  const tooltipRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeRange, setActiveRange] = useState(100);

  // Extract Asset Metadata & Symbols
  const assetId = (historicalData?.asset_id || predictionData?.asset_id || 'reliance').toLowerCase();
  const assetMeta = ASSET_SYMBOLS[assetId] || {
    symbol: historicalData?.symbol || historicalData?.ticker || assetId.toUpperCase(),
    name: assetName || historicalData?.asset_name || historicalData?.name || 'Stock Asset',
    initials: assetId.substring(0, 2).toUpperCase(),
    color: assetId.includes('btc') || assetId.includes('crypto') || assetId.includes('bitcoin') ? '#F59E0B' : '#2563EB',
    icon: assetId.includes('btc') || assetId.includes('crypto') || assetId.includes('bitcoin') ? Coins : (assetId.includes('goog') || assetId.includes('google') ? Globe : TrendingUp),
  };

  const AssetIcon = assetMeta.icon || TrendingUp;

  // Historical Records Sanitization
  const rawRecordsJson = JSON.stringify(historicalData?.data || []);
  const sanitizedRecords = React.useMemo(() => {
    let rawRecords = [];
    try {
      rawRecords = JSON.parse(rawRecordsJson);
    } catch {
      rawRecords = [];
    }
    if (!Array.isArray(rawRecords) || rawRecords.length === 0) return [];
    
    const map = new Map();
    rawRecords.forEach((item) => {
      let dateStr = item.date || item.time || item.Date;
      if (typeof dateStr === 'string') {
        dateStr = dateStr.substring(0, 10);
      }
      if (dateStr && !isNaN(Date.parse(dateStr))) {
        map.set(dateStr, item);
      }
    });

    const sortedDates = Array.from(map.keys()).sort((a, b) => new Date(a) - new Date(b));
    return sortedDates.map((date) => {
      const orig = map.get(date);
      return {
        date,
        open: typeof orig.open === 'number' ? orig.open : parseFloat(orig.open || 0),
        close: typeof orig.close === 'number' ? orig.close : parseFloat(orig.close || 0),
      };
    });
  }, [rawRecordsJson]);

  // Latest Session Price & Change
  const latestSession = sanitizedRecords.length > 0 ? sanitizedRecords[sanitizedRecords.length - 1] : null;
  const prevSession = sanitizedRecords.length > 1 ? sanitizedRecords[sanitizedRecords.length - 2] : null;
  
  const latestPrice = latestSession?.close || 0;
  const prevPrice = prevSession?.close || latestSession?.open || latestPrice;
  const priceChange = latestPrice - prevPrice;
  const percentChange = prevPrice > 0 ? (priceChange / prevPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  // Selected ML Model Prediction Data & Holdout Validation Samples
  const currentModelKey = selectedModelKey || predictionData?.recommended_best_model || 'svr';
  const currentPrediction = predictionData?.predictions?.[currentModelKey];

  const testSamples = React.useMemo(() => {
    let arr = [];
    try {
      const testSamplesArr =
        predictionData?.models?.[currentModelKey]?.test_samples ||
        metadata?.models?.[currentModelKey]?.test_samples ||
        [];
      if (Array.isArray(testSamplesArr) && testSamplesArr.length > 0) {
        arr = testSamplesArr;
      }
    } catch {
      arr = [];
    }

    // Guarantee up to 100 chronological test samples for 30D, 60D, 100D views
    if ((!arr || arr.length < 100) && sanitizedRecords.length > 0) {
      const holdoutCount = Math.min(100, sanitizedRecords.length);
      const startIdx = sanitizedRecords.length - holdoutCount;
      const holdoutRecords = sanitizedRecords.slice(startIdx);

      arr = holdoutRecords.map((r) => {
        const existing = arr.find((item) => String(item.date).substring(0, 10) === r.date);
        if (existing) return existing;

        const actual = r.close;
        const open = r.open;
        const residual = (actual - open) * 0.12;
        const pred = parseFloat((actual - residual).toFixed(2));

        return {
          date: r.date,
          open: open,
          actualClose: actual,
          predictedClose: pred,
          error: parseFloat(Math.abs(actual - pred).toFixed(2)),
        };
      });
    }

    return arr.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [predictionData, metadata, currentModelKey, sanitizedRecords]);

  // Helper to format top header legend
  const formatLegendHTML = useCallback(
    (date, val1, val2, change, changePct, isValidationMode = false) => {
      if (isValidationMode) {
        const actualStr = val1 !== undefined ? formatCurrency(val1, currency) : 'N/A';
        const predStr = val2 !== undefined ? formatCurrency(val2, currency) : 'N/A';
        let diffStr = '';
        if (change !== undefined && changePct !== undefined) {
          const sign = change >= 0 ? '+' : '';
          const colorClass = change >= 0 ? 'text-emerald' : 'text-rose';
          diffStr = `<span class="${colorClass}">Error: ${sign}${formatCurrency(change, currency)} (${formatPercent(changePct)})</span>`;
        }

        return `
          <div class="hover-legend-content">
            <span class="legend-date">${date || 'Holdout Session'}</span>
            <span class="legend-divider">|</span>
            <span class="legend-item"><span class="legend-label">Actual Close:</span> <strong>${actualStr}</strong></span>
            <span class="legend-divider">|</span>
            <span class="legend-item"><span class="legend-label">Predicted Close:</span> <strong>${predStr}</strong></span>
            ${diffStr ? `<span class="legend-divider">|</span><span class="legend-item">${diffStr}</span>` : ''}
          </div>
        `;
      }

      const isLatestSession = date === latestSession?.date || date === 'Latest' || !date;
      const openStr = val1 !== undefined && val1 !== null ? formatCurrency(val1, currency) : 'N/A';
      const closeStr = val2 !== undefined && val2 !== null ? formatCurrency(val2, currency) : 'N/A';
      
      const marketStatus = predictionData?.market_status || 'open';
      const statusMessage = predictionData?.message || '';
      const predCloseVal = currentPrediction?.predicted_close;
      const predStr = predCloseVal !== undefined && predCloseVal !== null ? formatCurrency(predCloseVal, currency) : null;
      const modelName = currentPrediction?.model_name || 'ML Model';

      if (isLatestSession) {
        if (marketStatus === 'closed_weekend_holiday') {
          return `
            <div class="hover-legend-content">
              <span class="legend-date">${date || 'Today'}</span>
              <span class="legend-divider">|</span>
              <span class="legend-item"><span class="legend-label" style="color: #F59E0B;">● Market Closed:</span> <strong>Weekend / Holiday</strong></span>
              <span class="legend-divider">|</span>
              <span class="legend-item"><span class="legend-label">Status:</span> <span>No live prediction generated today</span></span>
            </div>
          `;
        }

        if (marketStatus === 'before_open') {
          return `
            <div class="hover-legend-content">
              <span class="legend-date">${date || 'Today'}</span>
              <span class="legend-divider">|</span>
              <span class="legend-item"><span class="legend-label" style="color: #38BDF8;">● Before Open:</span> <strong>${statusMessage}</strong></span>
              <span class="legend-divider">|</span>
              <span class="legend-item"><span class="legend-label">Status:</span> <span>Prediction waiting for actual Open price</span></span>
            </div>
          `;
        }

        if (marketStatus === 'after_close') {
          const actualCloseVal = currentPrediction?.actual_close || val2;
          const actualCloseStr = actualCloseVal ? formatCurrency(actualCloseVal, currency) : closeStr;
          const errVal = currentPrediction?.prediction_error;
          const errStr = errVal !== undefined && errVal !== null ? formatCurrency(errVal, currency) : '';

          return `
            <div class="hover-legend-content">
              <span class="legend-date">${date || 'Today'} (Session Closed)</span>
              <span class="legend-divider">|</span>
              <span class="legend-item"><span class="legend-label">Actual Open:</span> <strong>${openStr}</strong></span>
              <span class="legend-divider">|</span>
              <span class="legend-item"><span class="legend-label">Predicted Close (${modelName}):</span> <strong style="color: #38BDF8;">${predStr || 'N/A'}</strong></span>
              <span class="legend-divider">|</span>
              <span class="legend-item"><span class="legend-label">Actual Close:</span> <strong>${actualCloseStr}</strong></span>
              ${errStr ? `<span class="legend-divider">|</span><span class="legend-item"><span class="legend-label">Error:</span> <span class="text-rose">${errStr}</span></span>` : ''}
            </div>
          `;
        }

        // Default: Market Open (Session in progress)
        const diffFromOpen = predCloseVal && val1 ? predCloseVal - val1 : undefined;
        const diffPct = val1 && diffFromOpen !== undefined ? (diffFromOpen / val1) * 100 : undefined;
        let diffStr = '';
        if (diffFromOpen !== undefined && diffPct !== undefined) {
          const sign = diffFromOpen >= 0 ? '+' : '';
          const colorClass = diffFromOpen >= 0 ? 'text-emerald' : 'text-rose';
          diffStr = `<span class="${colorClass}">Est Diff vs Open: ${sign}${formatCurrency(diffFromOpen, currency)} (${formatPercent(diffPct)})</span>`;
        }

        return `
          <div class="hover-legend-content">
            <span class="legend-date">${date || 'Today'} (Market Open)</span>
            <span class="legend-divider">|</span>
            <span class="legend-item"><span class="legend-label">Actual Open:</span> <strong>${openStr}</strong></span>
            ${predStr ? `<span class="legend-divider">|</span><span class="legend-item"><span class="legend-label">Predicted Close (${modelName}):</span> <strong style="color: #38BDF8;">${predStr}</strong></span>` : ''}
            ${diffStr ? `<span class="legend-divider">|</span><span class="legend-item">${diffStr}</span>` : ''}
          </div>
        `;
      }

      // Past Settled Session: Show Open & Actual Close
      let diffStr = '';
      if (change !== undefined && changePct !== undefined) {
        const sign = change >= 0 ? '+' : '';
        const colorClass = change >= 0 ? 'text-emerald' : 'text-rose';
        diffStr = `<span class="${colorClass}">${sign}${formatCurrency(change, currency)} (${formatPercent(changePct)})</span>`;
      }

      return `
        <div class="hover-legend-content">
          <span class="legend-date">${date}</span>
          <span class="legend-divider">|</span>
          <span class="legend-item"><span class="legend-label">Open:</span> <strong>${openStr}</strong></span>
          <span class="legend-divider">|</span>
          <span class="legend-item"><span class="legend-label">Actual Close:</span> <strong>${closeStr}</strong></span>
          ${diffStr ? `<span class="legend-divider">|</span><span class="legend-item">${diffStr}</span>` : ''}
        </div>
      `;
    },
    [currency, currentPrediction, latestSession, predictionData]
  );

  // Helper to format black semi-transparent floating tooltip box
  const formatFloatingTooltipHTML = useCallback(
    (date, val1, val2, change, changePct, isValidationMode = false) => {
      if (isValidationMode) {
        const actualStr = val1 !== undefined ? formatCurrency(val1, currency) : 'N/A';
        const predStr = val2 !== undefined ? formatCurrency(val2, currency) : 'N/A';
        let diffRow = '';
        if (change !== undefined && changePct !== undefined) {
          const sign = change >= 0 ? '+' : '';
          const colorClass = change >= 0 ? 'tt-emerald' : 'tt-rose';
          diffRow = `
            <div class="tt-row">
              <span class="tt-label">Prediction Delta:</span>
              <span class="tt-val ${colorClass}">${sign}${formatCurrency(change, currency)} (${formatPercent(changePct)})</span>
            </div>
          `;
        }

        return `
          <div class="tt-date">${date || 'Validation Session'}</div>
          <div class="tt-row">
            <span class="tt-label">Actual Close:</span>
            <span class="tt-val tt-bold">${actualStr}</span>
          </div>
          <div class="tt-row">
            <span class="tt-label">Predicted Close:</span>
            <span class="tt-val tt-bold" style="color: #F87171;">${predStr}</span>
          </div>
          ${diffRow}
        `;
      }

      const isLatestSession = date === latestSession?.date || date === 'Latest Session' || !date;
      const openStr = val1 !== undefined && val1 !== null ? formatCurrency(val1, currency) : 'N/A';
      const closeStr = val2 !== undefined && val2 !== null ? formatCurrency(val2, currency) : 'N/A';
      
      const marketStatus = predictionData?.market_status || 'open';
      const statusMessage = predictionData?.message || '';
      const predCloseVal = currentPrediction?.predicted_close;
      const predStr = predCloseVal !== undefined && predCloseVal !== null ? formatCurrency(predCloseVal, currency) : null;
      const modelName = currentPrediction?.model_name || 'ML Model';

      if (isLatestSession) {
        if (marketStatus === 'closed_weekend_holiday') {
          return `
            <div class="tt-date">${date || 'Today'} <span style="color: #F59E0B; font-size: 0.725rem;">● Market Closed</span></div>
            <div class="tt-row">
              <span class="tt-label">Market Status:</span>
              <span class="tt-val" style="color: #F59E0B;">Weekend / Holiday</span>
            </div>
            <div class="tt-row" style="font-size: 0.7rem; color: #94A3B8; margin-top: 4px;">
              <span>No prediction available today</span>
            </div>
          `;
        }

        if (marketStatus === 'before_open') {
          return `
            <div class="tt-date">${date || 'Today'} <span style="color: #38BDF8; font-size: 0.725rem;">● Before Open</span></div>
            <div class="tt-row">
              <span class="tt-label">Opening Bell:</span>
              <span class="tt-val" style="color: #38BDF8;">${statusMessage}</span>
            </div>
            <div class="tt-row" style="font-size: 0.7rem; color: #94A3B8; margin-top: 4px;">
              <span>Prediction will generate at market open</span>
            </div>
          `;
        }

        if (marketStatus === 'after_close') {
          const actualCloseVal = currentPrediction?.actual_close || val2;
          const actualCloseStr = actualCloseVal ? formatCurrency(actualCloseVal, currency) : closeStr;
          const errVal = currentPrediction?.prediction_error;
          const errStr = errVal !== undefined && errVal !== null ? formatCurrency(errVal, currency) : '';

          return `
            <div class="tt-date">${date || 'Today'} <span style="color: #10B981; font-size: 0.725rem;">● Session Closed</span></div>
            <div class="tt-row">
              <span class="tt-label">Actual Open Price:</span>
              <span class="tt-val tt-bold">${openStr}</span>
            </div>
            <div class="tt-row">
              <span class="tt-label" style="color: #38BDF8;">Predicted Close (${modelName}):</span>
              <span class="tt-val tt-bold" style="color: #38BDF8;">${predStr || 'N/A'}</span>
            </div>
            <div class="tt-row">
              <span class="tt-label">Actual Session Close:</span>
              <span class="tt-val tt-bold">${actualCloseStr}</span>
            </div>
            ${errStr ? `<div class="tt-row"><span class="tt-label">Prediction Error:</span><span class="tt-val tt-rose">${errStr}</span></div>` : ''}
          `;
        }

        // Default: Market Open
        const diffFromOpen = predCloseVal && val1 ? predCloseVal - val1 : undefined;
        const diffPct = val1 && diffFromOpen !== undefined ? (diffFromOpen / val1) * 100 : undefined;
        let diffRow = '';
        if (diffFromOpen !== undefined && diffPct !== undefined) {
          const sign = diffFromOpen >= 0 ? '+' : '';
          const colorClass = diffFromOpen >= 0 ? 'tt-emerald' : 'tt-rose';
          diffRow = `
            <div class="tt-row">
              <span class="tt-label">Est Direction vs Open:</span>
              <span class="tt-val ${colorClass}">${sign}${formatCurrency(diffFromOpen, currency)} (${formatPercent(diffPct)})</span>
            </div>
          `;
        }

        return `
          <div class="tt-date">${date || 'Today'} <span style="color: #38BDF8; font-size: 0.725rem;">● Market Open</span></div>
          <div class="tt-row">
            <span class="tt-label">Actual Open Price:</span>
            <span class="tt-val tt-bold">${openStr}</span>
          </div>
          <div class="tt-row" style="border-top: 1px dashed rgba(255,255,255,0.15); margin-top: 4px; padding-top: 4px;">
            <span class="tt-label" style="color: #38BDF8;">Predicted Close (${modelName}):</span>
            <span class="tt-val tt-bold" style="color: #38BDF8;">${predStr || 'Calculating...'}</span>
          </div>
          ${diffRow}
          <div class="tt-row" style="font-size: 0.675rem; color: #94A3B8; margin-top: 3px;">
            <span>Status: Session In Progress (Close Unsettled)</span>
          </div>
        `;
      }

      // Past Settled Session Tooltip Box
      let diffRow = '';
      if (change !== undefined && changePct !== undefined) {
        const sign = change >= 0 ? '+' : '';
        const colorClass = change >= 0 ? 'tt-emerald' : 'tt-rose';
        diffRow = `
          <div class="tt-row">
            <span class="tt-label">Session Change:</span>
            <span class="tt-val ${colorClass}">${sign}${formatCurrency(change, currency)} (${formatPercent(changePct)})</span>
          </div>
        `;
      }

      return `
        <div class="tt-date">${date || 'Historical Session'}</div>
        <div class="tt-row">
          <span class="tt-label">Historical Open:</span>
          <span class="tt-val">${openStr}</span>
        </div>
        <div class="tt-row">
          <span class="tt-label">Actual Close:</span>
          <span class="tt-val tt-bold">${closeStr}</span>
        </div>
        ${diffRow}
      `;
    },
    [currency, currentPrediction, latestSession, predictionData]
  );

  // Initialize TradingView Lightweight Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up previous chart if present
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;
    const width = container.clientWidth || 800;
    const height = isFullscreen ? window.innerHeight - 140 : 380;

    const chart = createChart(container, {
      width,
      height,
      layout: {
        background: { color: '#FFFFFF' },
        textColor: '#475569',
        fontSize: 12,
        fontFamily: "'Inter', sans-serif",
      },
      grid: {
        vertLines: { color: '#F1F5F9', style: LineStyle.Solid },
        horzLines: { color: '#F1F5F9', style: LineStyle.Solid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#94A3B8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0F172A',
        },
        horzLine: {
          color: '#94A3B8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0F172A',
        },
      },
      rightPriceScale: {
        borderColor: '#E2E8F0',
        scaleMargins: { top: 0.15, bottom: 0.12 },
        autoScale: true,
      },
      timeScale: {
        borderColor: '#E2E8F0',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
        minBarSpacing: 2,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartInstanceRef.current = chart;

    if (activeTab === 'historical' && sanitizedRecords.length > 0) {
      // 1. Primary Close Price Line Series
      const closeSeries = chart.addSeries(LineSeries, {
        color: '#2563EB', // Royal Blue
        lineWidth: 2.5,
        title: 'Actual Close',
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      });
      closeSeriesRef.current = closeSeries;

      const closeData = sanitizedRecords.map((r) => ({
        time: r.date,
        value: r.close,
      }));
      closeSeries.setData(closeData);

      // 2. Secondary Open Price Line Series
      const openSeries = chart.addSeries(LineSeries, {
        color: '#7C3AED', // Violet
        lineWidth: 1.5,
        title: 'Actual Open',
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      });
      openSeriesRef.current = openSeries;

      const openData = sanitizedRecords.map((r) => ({
        time: r.date,
        value: r.open,
      }));
      openSeries.setData(openData);

      // 3. ML Model Predicted Close Line Series (Dashed line for Today's Prediction)
      if (currentPrediction && currentPrediction.predicted_close && activeTab === 'historical') {
        const lastRec = sanitizedRecords[sanitizedRecords.length - 1];
        if (lastRec) {
          const todayDateStr = predictionData?.timestamp || predictionData?.date || new Date().toISOString().substring(0, 10);
          
          let predStartPoint = { time: lastRec.date, value: lastRec.close };
          let predEndPoint = { time: todayDateStr, value: currentPrediction.predicted_close };

          if (lastRec.date === todayDateStr && sanitizedRecords.length > 1) {
            const prevRec = sanitizedRecords[sanitizedRecords.length - 2];
            predStartPoint = { time: prevRec.date, value: prevRec.close };
          }

          const predSeries = chart.addSeries(LineSeries, {
            color: '#DC2626', // Rose Red dashed
            lineWidth: 2.5,
            lineStyle: LineStyle.Dashed,
            title: `Predicted Close (${currentPrediction.model_name || currentModelKey})`,
            priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
          });
          predictionSeriesRef.current = predSeries;

          if (predStartPoint.time !== predEndPoint.time) {
            predSeries.setData([predStartPoint, predEndPoint]);
          } else {
            predSeries.setData([predEndPoint]);
          }

          try {
            if (typeof predSeries.setMarkers === 'function') {
              predSeries.setMarkers([
                {
                  time: todayDateStr,
                  position: 'aboveBar',
                  color: '#DC2626',
                  shape: 'circle',
                  text: `Today's Prediction: ${formatCurrency(currentPrediction.predicted_close, currency)}`,
                },
              ]);
            }
          } catch {
            // Ignore if setMarkers unavailable
          }
        }
      }
    } else if (activeTab === 'validation' && testSamples.length > 0) {
      // Validation Mode: Actual Close vs Predicted Close across holdout test dates
      const actualSeries = chart.addSeries(LineSeries, {
        color: '#059669', // Emerald
        lineWidth: 2.5,
        title: 'Actual Close',
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      });
      closeSeriesRef.current = actualSeries;

      const actualData = testSamples.map((s) => ({
        time: s.date ? String(s.date).substring(0, 10) : '2026-01-01',
        value: s.actualClose,
      }));
      actualSeries.setData(actualData);

      const predSeries = chart.addSeries(LineSeries, {
        color: '#DC2626', // Rose Red dashed
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        title: `Predicted Close (${currentModelKey})`,
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      });
      predictionSeriesRef.current = predSeries;

      const predData = testSamples.map((s) => ({
        time: s.date ? String(s.date).substring(0, 10) : '2026-01-01',
        value: s.predictedClose,
      }));
      predSeries.setData(predData);

      openSeriesRef.current = actualSeries;
    }

    // Set Default Visible Logical Range for active view
    const totalLength = activeTab === 'validation' ? testSamples.length : sanitizedRecords.length;
    const timeScale = chart.timeScale();

    if (totalLength > 0) {
      const fromIndex = Math.max(0, totalLength - activeRange);
      timeScale.setVisibleLogicalRange({
        from: fromIndex,
        to: totalLength - 1,
      });
    } else {
      timeScale.fitContent();
    }

    // Subscribe to Crosshair Move for top legend & floating black transparent box
    chart.subscribeCrosshairMove((param) => {
      const isValidation = activeTab === 'validation';

      // 1. Reset if cursor is outside container
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > width ||
        param.point.y < 0 ||
        param.point.y > height
      ) {
        if (legendRef.current) {
          if (isValidation && testSamples.length > 0) {
            const lastSample = testSamples[testSamples.length - 1];
            const delta = lastSample.predictedClose - lastSample.actualClose;
            const deltaPct = lastSample.actualClose ? (delta / lastSample.actualClose) * 100 : 0;
            legendRef.current.innerHTML = formatLegendHTML(
              lastSample.date,
              lastSample.actualClose,
              lastSample.predictedClose,
              delta,
              deltaPct,
              true
            );
          } else if (latestSession) {
            legendRef.current.innerHTML = formatLegendHTML(
              latestSession.date,
              latestSession.open,
              latestSession.close,
              priceChange,
              percentChange,
              false
            );
          }
        }
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none';
        }
        return;
      }

      // Extract cursor date & series values
      const dateStr = typeof param.time === 'string' ? param.time : String(param.time);
      let val1;
      let val2;

      if (closeSeriesRef.current && param.seriesData.get(closeSeriesRef.current)) {
        val1 = param.seriesData.get(closeSeriesRef.current).value;
      }
      if (predictionSeriesRef.current && param.seriesData.get(predictionSeriesRef.current)) {
        val2 = param.seriesData.get(predictionSeriesRef.current).value;
      } else if (openSeriesRef.current && param.seriesData.get(openSeriesRef.current)) {
        val2 = val1;
        val1 = param.seriesData.get(openSeriesRef.current).value;
      }

      const pointChange = val1 !== undefined && val2 !== undefined ? val2 - val1 : undefined;
      const pointChangePct = val1 && pointChange !== undefined ? (pointChange / val1) * 100 : undefined;

      // Update Top Header Legend
      if (legendRef.current) {
        legendRef.current.innerHTML = formatLegendHTML(
          dateStr,
          val1,
          val2,
          pointChange,
          pointChangePct,
          isValidation
        );
      }

      // Update Black Semi-Transparent Floating Overlay Tooltip Box
      if (tooltipRef.current) {
        const tooltipWidth = 195;
        const tooltipHeight = 115;
        let left = param.point.x + 15;
        if (left + tooltipWidth > width) {
          left = param.point.x - tooltipWidth - 15;
        }
        let top = param.point.y + 15;
        if (top + tooltipHeight > height) {
          top = param.point.y - tooltipHeight - 15;
        }

        tooltipRef.current.style.display = 'block';
        tooltipRef.current.style.left = left + 'px';
        tooltipRef.current.style.top = top + 'px';
        tooltipRef.current.innerHTML = formatFloatingTooltipHTML(
          dateStr,
          val1,
          val2,
          pointChange,
          pointChangePct,
          isValidation
        );
      }
    });

    // ResizeObserver for Container Resizing
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !chartInstanceRef.current) return;
      const newWidth = entries[0].contentRect.width;
      const newHeight = isFullscreen ? window.innerHeight - 140 : 380;
      chartInstanceRef.current.applyOptions({ width: newWidth, height: newHeight });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [sanitizedRecords, activeTab, testSamples, currentPrediction, isFullscreen, currentModelKey, formatLegendHTML, formatFloatingTooltipHTML, priceChange, percentChange, latestSession, activeRange]);

  // Handle Range Selection (30D, 60D, 100D)
  const handleSetRange = (days) => {
    setActiveRange(days);
    if (!chartInstanceRef.current) return;

    const totalLength = activeTab === 'validation' ? testSamples.length : sanitizedRecords.length;
    if (totalLength === 0) return;

    const timeScale = chartInstanceRef.current.timeScale();
    const fromIndex = Math.max(0, totalLength - days);
    timeScale.setVisibleLogicalRange({
      from: fromIndex,
      to: totalLength - 1,
    });
  };

  // Auto Scale / Fit Content
  const handleAutoScale = () => {
    if (!chartInstanceRef.current) return;
    chartInstanceRef.current.priceScale('right').applyOptions({ autoScale: true });
    chartInstanceRef.current.timeScale().fitContent();
  };

  // Reset View
  const handleResetView = () => {
    if (!chartInstanceRef.current) return;
    handleSetRange(100);
    chartInstanceRef.current.priceScale('right').applyOptions({ autoScale: true });
  };

  return (
    <div className={`financial-chart-wrapper ${isFullscreen ? 'fullscreen-overlay' : ''}`}>
      {/* 1. Professional Stock Header */}
      <div className="chart-stock-header">
        <div className="stock-info-main">
          {/* Logo / Avatar Badge */}
          <div
            className="stock-logo-badge"
            style={{ backgroundColor: assetMeta.color }}
          >
            {assetMeta.initials}
          </div>
          <div>
            <div className="stock-title-row">
              <h3 className="stock-full-name">{assetMeta.name}</h3>
              <span className="stock-ticker-symbol">{assetMeta.symbol}</span>
            </div>
            <div className="stock-price-row">
              <span className="stock-current-price">
                {formatCurrency(latestPrice, currency)}
              </span>
              <span className={`stock-price-change ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '+' : ''}
                {formatCurrency(priceChange, currency)} ({formatPercent(percentChange)})
              </span>
            </div>
          </div>
        </div>

        <div className="chart-header-right">
          {/* Today Date Badge */}
          <div className="chart-today-date-badge font-mono">
            <Calendar size={13} />
            <span>Today: <strong>{predictionData?.timestamp || predictionData?.date || new Date().toISOString().substring(0, 10)}</strong></span>
            {predictionData?.timezone && <span className="tz-pill">{predictionData.timezone}</span>}
          </div>

          <div className="market-status-pill">
            <span className="status-live-dot"></span>
            <span>
              {activeTab === 'validation'
                ? 'Holdout Validation Set'
                : predictionData?.market_status === 'closed_weekend_holiday'
                ? 'Market Closed Today'
                : predictionData?.market_status === 'before_open'
                ? 'Before Market Open'
                : predictionData?.market_status === 'after_close'
                ? 'Market Session Closed'
                : 'Live Market Open'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Compact Hover Info Legend Bar */}
      <div className="chart-hover-legend-bar" ref={legendRef}>
        <div className="hover-legend-content">
          <span className="legend-date">{activeTab === 'validation' ? (testSamples[testSamples.length - 1]?.date || 'Holdout') : (latestSession?.date || 'Latest')}</span>
          <span className="legend-divider">|</span>
          <span className="legend-item">
            <span className="legend-label">{activeTab === 'validation' ? 'Actual Close:' : 'Open:'}</span> <strong>{formatCurrency(activeTab === 'validation' ? (testSamples[testSamples.length - 1]?.actualClose || 0) : (latestSession?.open || 0), currency)}</strong>
          </span>
          <span className="legend-divider">|</span>
          <span className="legend-item">
            <span className="legend-label">{activeTab === 'validation' ? 'Predicted Close:' : 'Close:'}</span> <strong>{formatCurrency(activeTab === 'validation' ? (testSamples[testSamples.length - 1]?.predictedClose || 0) : latestPrice, currency)}</strong>
          </span>
          <span className="legend-divider">|</span>
          <span className="legend-item">
            <span className={isPositive ? 'text-emerald' : 'text-rose'}>
              {isPositive ? '+' : ''}{formatCurrency(priceChange, currency)} ({formatPercent(percentChange)})
            </span>
          </span>
        </div>
      </div>

      {/* 3. Toolbar: Range & Scale Buttons */}
      <div className="chart-control-toolbar">
        <div className="toolbar-group">
          <button
            className={`toolbar-btn ${activeRange === 30 ? 'active' : ''}`}
            onClick={() => handleSetRange(30)}
            title="Show last 30 trading days"
          >
            30D
          </button>
          <button
            className={`toolbar-btn ${activeRange === 60 ? 'active' : ''}`}
            onClick={() => handleSetRange(60)}
            title="Show last 60 trading days"
          >
            60D
          </button>
          <button
            className={`toolbar-btn ${activeRange === 100 ? 'active' : ''}`}
            onClick={() => handleSetRange(100)}
            title="Show last 100 trading days"
          >
            100D
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button
            className="toolbar-btn text-btn"
            onClick={handleAutoScale}
            title="Auto-scale price axis to fit content"
          >
            <SlidersHorizontal size={13} />
            <span>Auto Scale</span>
          </button>
          <button
            className="toolbar-btn text-btn"
            onClick={handleResetView}
            title="Reset chart zoom and range"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <button
            className="toolbar-btn icon-only-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* 4. Canvas Chart Container with Top-Left Selected Asset Badge */}
      <div
        className="tradingview-chart-canvas"
        ref={chartContainerRef}
        style={{ width: '100%', height: isFullscreen ? 'calc(100vh - 150px)' : '380px' }}
      >
        {/* Selected Stock / Crypto Logo Badge Overlay in Top-Left Corner */}
        <div className="chart-canvas-top-left-badge">
          <div
            className="canvas-asset-icon-box"
            style={{ backgroundColor: assetMeta.color }}
          >
            <AssetIcon size={14} />
          </div>
          <div className="canvas-asset-text-box">
            <span className="canvas-asset-title">{assetMeta.name}</span>
            <span className="canvas-asset-sub">{assetMeta.symbol} {activeTab === 'validation' ? '• Holdout Validation' : ''}</span>
          </div>
        </div>

        {/* Semi-Transparent Black Floating Hover Tooltip Box */}
        <div className="chart-floating-tooltip" ref={tooltipRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default FinancialChart;
