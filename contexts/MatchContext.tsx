import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MatchPair, currentMatchPairs, reviewedMatches as initialReviewedMatches } from '../mockData';

interface MatchContextType {
  pendingMatches: MatchPair[];
  reviewedMatches: MatchPair[];
  reviewMatch: (matchId: string, status: 'confirmed' | 'rejected', reviewer: string, rejectionReason?: string) => void;
  undoReview: (matchId: string) => void;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export function MatchProvider({ children }: { children: ReactNode }) {
  const [pendingMatches, setPendingMatches] = useState<MatchPair[]>(currentMatchPairs);
  const [reviewedMatches, setReviewedMatches] = useState<MatchPair[]>(initialReviewedMatches);
  const [reviewHistory, setReviewHistory] = useState<Array<{ match: MatchPair; wasPending: boolean }>>([]);

  const reviewMatch = (matchId: string, status: 'confirmed' | 'rejected', reviewer: string, rejectionReason?: string) => {
    const match = pendingMatches.find(m => m.id === matchId);
    if (!match) return;

    const reviewedMatch: MatchPair = {
      ...match,
      status,
      reviewer,
      reviewedAt: new Date().toISOString(),
      rejectionReason: status === 'rejected' ? rejectionReason : undefined,
    };

    // Remove from pending and add to reviewed
    setPendingMatches(prev => prev.filter(m => m.id !== matchId));
    setReviewedMatches(prev => [...prev, reviewedMatch]);
    
    // Track history for undo
    setReviewHistory(prev => [...prev, { match: reviewedMatch, wasPending: true }]);
  };

  const undoReview = (matchId: string) => {
    const historyEntry = reviewHistory.find(h => h.match.id === matchId);
    if (!historyEntry) return;

    const match = reviewedMatches.find(m => m.id === matchId);
    if (!match) return;

    // Remove from reviewed
    setReviewedMatches(prev => prev.filter(m => m.id !== matchId));
    
    // If it was originally pending, add it back
    if (historyEntry.wasPending) {
      const originalMatch: MatchPair = {
        ...match,
        status: 'suggested' as const,
        reviewer: undefined,
        reviewedAt: undefined,
        rejectionReason: undefined,
      };
      setPendingMatches(prev => [...prev, originalMatch]);
    }

    // Remove from history
    setReviewHistory(prev => prev.filter(h => h.match.id !== matchId));
  };

  return (
    <MatchContext.Provider value={{ pendingMatches, reviewedMatches, reviewMatch, undoReview }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatches() {
  const context = useContext(MatchContext);
  if (context === undefined) {
    throw new Error('useMatches must be used within a MatchProvider');
  }
  return context;
}
