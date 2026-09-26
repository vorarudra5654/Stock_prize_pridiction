import React from 'react';
import { RouterProvider, useRouter } from './router/RouterContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ModelsOverview from './pages/ModelsOverview';
import ModelPage from './pages/ModelPage';
import ModelAboutPage from './pages/ModelAboutPage';
import AboutPage from './pages/AboutPage';
import { useAssetData } from './hooks/useAssetData';
import './App.css';

const MainAppContent = () => {
  const { currentPath } = useRouter();
  const assetDataProps = useAssetData();

  // Route matching logic
  const renderRoute = () => {
    const path = currentPath.toLowerCase().trim();

    if (path === '/' || path === '') {
      return (
        <Home
          assets={assetDataProps.assets}
          comparisonData={assetDataProps.comparisonData}
        />
      );
    }

    // Match /models, /model, /models/, /model/
    if (
      path === '/models' ||
      path === '/models/' ||
      path === '/model' ||
      path === '/model/'
    ) {
      return (
        <ModelsOverview
          assets={assetDataProps.assets}
          selectedAssetId={assetDataProps.selectedAssetId}
          onSelectAsset={assetDataProps.setSelectedAssetId}
          comparisonData={assetDataProps.comparisonData}
          historicalData={assetDataProps.historicalData}
          predictionData={assetDataProps.predictionData}
        />
      );
    }

    if (path === '/about' || path === '/about/') {
      return <AboutPage />;
    }

    // Match /models/:slug, /model/:slug, /models/:slug/about, /model/:slug/about
    if (path.startsWith('/models/') || path.startsWith('/model/')) {
      const parts = path.split('/').filter(Boolean); // ['models', 'linear-regression'] or ['model', 'svr']
      if (parts.length >= 2) {
        const modelSlug = parts[1];
        const isAbout = parts.length >= 3 && parts[2] === 'about';

        if (isAbout) {
          return <ModelAboutPage slug={modelSlug} />;
        }

        return (
          <ModelPage
            slug={modelSlug}
            assets={assetDataProps.assets}
            selectedAssetId={assetDataProps.selectedAssetId}
            onSelectAsset={assetDataProps.setSelectedAssetId}
            predictionData={assetDataProps.predictionData}
            historicalData={assetDataProps.historicalData}
            comparisonData={assetDataProps.comparisonData}
            loading={assetDataProps.loading}
            error={assetDataProps.error}
            isCustomInput={assetDataProps.isCustomInput}
            onCustomPrediction={assetDataProps.handleCustomPrediction}
            onResetRealtime={assetDataProps.handleResetToRealtime}
          />
        );
      }
    }

    // Default fallback
    return (
      <Home
        assets={assetDataProps.assets}
        comparisonData={assetDataProps.comparisonData}
      />
    );
  };

  return (
    <div className="app-layout">
      <Navbar
        assets={assetDataProps.assets}
        selectedAssetId={assetDataProps.selectedAssetId}
        onSelectAsset={assetDataProps.setSelectedAssetId}
      />
      <main className="main-content-viewport">{renderRoute()}</main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <RouterProvider>
      <MainAppContent />
    </RouterProvider>
  );
}

export default App;
