import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { AdminDashboard } from './components/AdminDashboard';
import { ReviewerScreen } from './components/ReviewerScreen';
import { FeedbackDashboard } from './components/FeedbackDashboard';
import { MatchManagement } from './components/MatchManagement';
import { Toaster } from './components/ui/sonner';
import { MatchProvider } from './contexts/MatchContext';
import Splash from './components/Splash';

export default function App() {
  const [currentView, setCurrentView] = useState('admin');

  return (
    <MatchProvider>
      <Splash />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <Navigation currentView={currentView} setCurrentView={setCurrentView} />

        {currentView === 'admin' && <AdminDashboard />}
        {currentView === 'reviewer' && <ReviewerScreen />}
        {currentView === 'analytics' && <FeedbackDashboard />}
        {currentView === 'management' && <MatchManagement />}

        <Toaster />
      </div>
    </MatchProvider>
  );
}
