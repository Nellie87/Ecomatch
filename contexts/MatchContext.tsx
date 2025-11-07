import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import rawCandidates from '../src/mocks/candidates.json';
import type { CandidateGroup, SourceRecord, Status, ReviewedItem } from '../src/types/hitl';

const STORAGE_KEY = 'eco_match_decisions_v1';

interface MatchContextType {
  candidates: CandidateGroup[];
  reviewed: ReviewedItem[];
  filters: {
    search: string;
    status: 'All' | 'Accepted' | 'Rejected' | 'NeedsReview';
    band: 'All' | 'High' | 'Low';
    dateRange: 'All' | 'ThisWeek' | 'Last30';
    reviewer?: string;
  };
  setFilters: (filters: Partial<MatchContextType['filters']>) => void;
  // Single actions
  confirm: (groupIds: string | string[]) => void;
  reject: (groupIds: string | string[]) => void;
  needsReview: (groupIds: string | string[]) => void;
  merge: (groupIds: string | string[]) => void;
  split: (groupIds: string | string[]) => void;
  // Batch actions
  batchConfirm: (ids: string[]) => void;
  batchReject: (ids: string[]) => void;
  batchMerge: (ids: string[]) => void;
  batchSplit: (ids: string[]) => void;
  // Undo
  undo: (groupId: string) => void;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

// Helper to determine final record: prefer registry, fallback to first record
function getFinalRecord(group: CandidateGroup): SourceRecord {
  const registry = group.records.find(r => r.source === 'registry');
  if (registry) return registry;
  return group.records[0] || group.records[0];
}

// Load from localStorage
function loadFromLocalStorage(): CandidateGroup[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.candidates || [];
  } catch {
    return [];
  }
}

// Save to localStorage
function saveToLocalStorage(candidates: CandidateGroup[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ candidates, timestamp: new Date().toISOString() }));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// Derive reviewed items from candidates
function deriveReviewedItems(candidates: CandidateGroup[]): ReviewedItem[] {
  return candidates
    .filter(c => c.status !== 'suggested' && c.reviewer && c.reviewed_at)
    .map(c => ({
      id: c.id,
      finalRecord: getFinalRecord(c),
      status: c.status as Exclude<Status, 'suggested'>,
      confidence: c.confidence,
      reviewer: c.reviewer!,
      reviewedAt: c.reviewed_at!,
    }));
}

export function MatchProvider({ children }: { children: ReactNode }) {
  // Initialize candidates: merge localStorage with JSON data
  const [candidates, setCandidates] = useState<CandidateGroup[]>(() => {
    const stored = loadFromLocalStorage();
    const jsonData = (rawCandidates as CandidateGroup[]).map(c => ({ ...c }));
    
    // Merge: if stored has a candidate with same ID, use stored version, otherwise use JSON
    const merged = jsonData.map(jsonCandidate => {
      const storedCandidate = stored.find(s => s.id === jsonCandidate.id);
      return storedCandidate || jsonCandidate;
    });
    
    // Add any stored candidates not in JSON
    const storedOnly = stored.filter(s => !jsonData.find(j => j.id === s.id));
    return [...merged, ...storedOnly];
  });

  const [reviewed, setReviewed] = useState<ReviewedItem[]>(() => deriveReviewedItems(candidates));

  const [filters, setFiltersState] = useState<MatchContextType['filters']>({
    search: '',
    status: 'All',
    band: 'All',
    dateRange: 'All',
  });

  // Update reviewed when candidates change
  useEffect(() => {
    setReviewed(deriveReviewedItems(candidates));
  }, [candidates]);

  // Persist to localStorage when candidates change
  useEffect(() => {
    saveToLocalStorage(candidates);
  }, [candidates]);

  const setFilters = useCallback((updates: Partial<MatchContextType['filters']>) => {
    setFiltersState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateCandidateStatus = useCallback((
    groupIds: string | string[],
    status: Status,
    reviewer: string = 'Current User'
  ) => {
    const ids = Array.isArray(groupIds) ? groupIds : [groupIds];
    setCandidates(prev =>
      prev.map(c =>
        ids.includes(c.id)
          ? { ...c, status, reviewer, reviewed_at: new Date().toISOString() }
          : c
      )
    );
  }, []);

  const confirm = useCallback((groupIds: string | string[]) => {
    updateCandidateStatus(groupIds, 'confirmed');
  }, [updateCandidateStatus]);

  const reject = useCallback((groupIds: string | string[]) => {
    updateCandidateStatus(groupIds, 'rejected');
  }, [updateCandidateStatus]);

  const needsReview = useCallback((groupIds: string | string[]) => {
    updateCandidateStatus(groupIds, 'needs_review');
  }, [updateCandidateStatus]);

  const merge = useCallback((groupIds: string | string[]) => {
    // Merge is treated as confirmed
    updateCandidateStatus(groupIds, 'confirmed');
  }, [updateCandidateStatus]);

  const split = useCallback((groupIds: string | string[]) => {
    // Split is treated as needs_review
    updateCandidateStatus(groupIds, 'needs_review');
  }, [updateCandidateStatus]);

  const batchConfirm = useCallback((ids: string[]) => {
    confirm(ids);
  }, [confirm]);

  const batchReject = useCallback((ids: string[]) => {
    reject(ids);
  }, [reject]);

  const batchMerge = useCallback((ids: string[]) => {
    merge(ids);
  }, [merge]);

  const batchSplit = useCallback((ids: string[]) => {
    split(ids);
  }, [split]);

  const undo = useCallback((groupId: string) => {
    setCandidates(prev =>
      prev.map(c =>
        c.id === groupId
          ? { ...c, status: 'suggested' as Status, reviewer: undefined, reviewed_at: undefined }
          : c
      )
    );
  }, []);

  return (
    <MatchContext.Provider
      value={{
        candidates,
        reviewed,
        filters,
        setFilters,
        confirm,
        reject,
        needsReview,
        merge,
        split,
        batchConfirm,
        batchReject,
        batchMerge,
        batchSplit,
        undo,
      }}
    >
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
