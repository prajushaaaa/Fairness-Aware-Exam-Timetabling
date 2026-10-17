import React from 'react';
import { TimetableProvider, useTimetable } from './context/TimetableContext';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { InputDataPage } from './pages/InputDataPage';
import { GenerateTimetablePage } from './pages/GenerateTimetablePage';
import { ResultsComparisonPage } from './pages/ResultsComparisonPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function AppContent() {
  const { activeTab } = useTimetable();

  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'input':
      case 'upload':
        return <InputDataPage />;
      case 'generate':
        return <GenerateTimetablePage />;
      case 'results':
      case 'comparison':
      case 'fairness':
        return <ResultsComparisonPage />;
      default:
        return <DashboardPage />;
    }
  };

  return <Layout>{renderCurrentPage()}</Layout>;
}

export function App() {
  return (
    <ErrorBoundary>
      <TimetableProvider>
        <AppContent />
      </TimetableProvider>
    </ErrorBoundary>
  );
}

export default App;
