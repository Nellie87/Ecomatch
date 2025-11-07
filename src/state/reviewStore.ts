import { create } from 'zustand';
import data from '../mocks/candidates.json';
import type { CandidateGroup, Status } from '../types/hitl';

type ReviewStore = {
  all: CandidateGroup[];
  filtered: CandidateGroup[];
  selection: Set<string>; // selected group ids for batch ops (Rejected / Needs Review)
  filter: {
    q: string;
    status: 'all' | 'confirmed' | 'rejected' | 'needs_review' | 'suggested' | 'conflicted';
    band?: 'veryHigh' | 'high' | 'other';
    dateRange?: 'today' | 'thisWeek' | 'last30';
    confidence?: { min?: number; max?: number };
  };
  load: () => void;
  applyFilters: () => void;
  setQuery: (q: string) => void;
  setStatus: (s: ReviewStore['filter']['status']) => void;
  setBand: (b?: 'veryHigh' | 'high' | 'other') => void;
  setDateRange: (r?: ReviewStore['filter']['dateRange']) => void;
  setConfidence: (c?: { min?: number; max?: number }) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  // actions mutate `status` locally
  confirm: (ids: string[] | string) => void;
  reject: (ids: string[] | string) => void;
  needsReview: (ids: string[] | string) => void;
  merge: (ids: string[] | string) => void; // demo: just set status 'confirmed'
  split: (ids: string[] | string) => void; // demo: set status 'needs_review'
  undo: (id: string) => void; // revert to suggested
};

export const useReviewStore = create<ReviewStore>((set, get) => ({
  all: [],
  filtered: [],
  selection: new Set(),
  filter: { q: '', status: 'all' },

  load: () => {
    try {
      const all = (data as CandidateGroup[]).map((g) => ({ ...g }));
      set({ all }, () => get().applyFilters());
    } catch (error) {
      console.error('Error loading store:', error);
      set({ all: [] }, () => get().applyFilters());
    }
  },

  applyFilters: () => {
    const { all, filter } = get();
    const q = filter.q.trim().toLowerCase();
    let out = [...all];

    if (filter.status !== 'all') out = out.filter((g) => g.status === filter.status);
    if (filter.band) out = out.filter((g) => g.band === filter.band);

    if (filter.confidence?.min != null) out = out.filter((g) => g.confidence >= (filter.confidence!.min!));
    if (filter.confidence?.max != null) out = out.filter((g) => g.confidence <= (filter.confidence!.max!));

    if (filter.dateRange) {
      const now = new Date();
      out = out.filter((g) => {
        const d = new Date(g.reviewed_at ?? g.created_at);
        const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        if (filter.dateRange === 'today') return diff < 1;
        if (filter.dateRange === 'thisWeek') return diff < 7;
        if (filter.dateRange === 'last30') return diff < 30;
        return true;
      });
    }

    if (q) {
      out = out.filter((g) =>
        g.records.some((r) => {
          const f = r.fields;
          return (
            f.name?.toLowerCase().includes(q) ||
            f.vat?.toLowerCase().includes(q) ||
            f.registry_code?.toLowerCase().includes(q) ||
            f.address?.toLowerCase().includes(q) ||
            f.country?.toLowerCase().includes(q) ||
            g.reviewer?.toLowerCase().includes(q)
          );
        })
      );
    }

    set({ filtered: out });
  },

  setQuery: (q) => set((s) => ({ filter: { ...s.filter, q } }), () => get().applyFilters()),
  setStatus: (status) => set((s) => ({ filter: { ...s.filter, status } }), () => get().applyFilters()),
  setBand: (band) => set((s) => ({ filter: { ...s.filter, band } }), () => get().applyFilters()),
  setDateRange: (dateRange) => set((s) => ({ filter: { ...s.filter, dateRange } }), () => get().applyFilters()),
  setConfidence: (confidence) => set((s) => ({ filter: { ...s.filter, confidence } }), () => get().applyFilters()),

  toggleSelect: (id) =>
    set((s) => {
      const selection = new Set(s.selection);
      selection.has(id) ? selection.delete(id) : selection.add(id);
      return { selection };
    }),

  clearSelection: () => set({ selection: new Set() }),

  confirm: (ids) => {
    const arr = Array.isArray(ids) ? ids : [ids];
    set((s) => ({
      all: s.all.map((g) => (arr.includes(g.id) ? { ...g, status: 'confirmed' as Status, reviewed_at: new Date().toISOString(), reviewer: 'Current User' } : g))
    }), () => get().applyFilters());
  },

  reject: (ids) => {
    const arr = Array.isArray(ids) ? ids : [ids];
    set((s) => ({
      all: s.all.map((g) => (arr.includes(g.id) ? { ...g, status: 'rejected' as Status, reviewed_at: new Date().toISOString(), reviewer: 'Current User' } : g))
    }), () => get().applyFilters());
  },

  needsReview: (ids) => {
    const arr = Array.isArray(ids) ? ids : [ids];
    set((s) => ({
      all: s.all.map((g) => (arr.includes(g.id) ? { ...g, status: 'needs_review' as Status } : g))
    }), () => get().applyFilters());
  },

  merge: (ids) => {
    const arr = Array.isArray(ids) ? ids : [ids];
    // Simulation: mark as confirmed
    set((s) => ({
      all: s.all.map((g) => (arr.includes(g.id) ? { ...g, status: 'confirmed' as Status, reviewed_at: new Date().toISOString(), reviewer: 'Current User' } : g))
    }), () => get().applyFilters());
  },

  split: (ids) => {
    const arr = Array.isArray(ids) ? ids : [ids];
    // Simulation: move to needs_review
    set((s) => ({
      all: s.all.map((g) => (arr.includes(g.id) ? { ...g, status: 'needs_review' as Status } : g))
    }), () => get().applyFilters());
  },

  undo: (id) => {
    set((s) => ({
      all: s.all.map((g) => (g.id === id ? { ...g, status: 'suggested' as Status, reviewed_at: undefined, reviewer: undefined } : g))
    }), () => get().applyFilters());
  }
}));

