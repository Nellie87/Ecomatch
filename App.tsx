import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { AdminDashboard } from './components/AdminDashboard';
import { ReviewerScreen } from './components/ReviewerScreen';
import { FeedbackDashboard } from './components/FeedbackDashboard';
import { MatchManagement } from './components/MatchManagement';
import { Toaster } from './components/ui/sonner';
import { MatchProvider } from './contexts/MatchContext';
import EchoSplash from './src/components/splash/EchoSplash';
import { useReviewStore } from './src/state/reviewStore';

// Simple Error Boundary
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Runtime Error</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const [splashVisible, setSplashVisible] = useState(true);
  const store = useReviewStore();

  useEffect(() => {
    try {
      store.load();
    } catch (error) {
      console.error('Error loading store:', error);
    }
  }, [store]);

  return (
    <>
      {splashVisible && <EchoSplash onDone={() => setSplashVisible(false)} />}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <Navigation />

        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/review" element={<ReviewerScreen />} />
            <Route path="/management" element={<MatchManagement />} />
            <Route path="/analytics" element={<FeedbackDashboard />} />
            <Route path="*" element={<div className="p-6 text-center">Not Found</div>} />
          </Routes>
        </ErrorBoundary>

        <Toaster />
      </div>
    </>
  );
}

export default function App() {
  return (
    <MatchProvider>
      <AppContent />
    </MatchProvider>
  );
}
