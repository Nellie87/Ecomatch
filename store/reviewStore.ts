import { create } from "zustand";
import type { CandidateGroup, Status, ActionKind } from "../types/matching";
import seedData from "../data/mockCandidates.json";

const seed = seedData as CandidateGroup[];

type State = {
  items: CandidateGroup[];
  selected: Set<string>;
  filter: Status | "all";
  select: (id: string, checked: boolean) => void;
  clearSelection: () => void;
  setFilter: (f: State["filter"]) => void;
  actOn: (ids: string[], action: ActionKind) => void;
};

function nextStatus(current: Status, action: ActionKind): Status {
  switch (action) {
    case "confirm": return "confirmed";
    case "reject": return "rejected";
    case "merge": return "confirmed"; // assume merge leads to a confirmed unified entity (UI-only)
    case "split": return "needs_review";
  }
}

export const useReviewStore = create<State>((set, get) => ({
  items: seed,
  selected: new Set<string>(),
  filter: "all",
  select: (id, checked) => set(s => {
    const next = new Set(s.selected);
    checked ? next.add(id) : next.delete(id);
    return { selected: next };
  }),
  clearSelection: () => set({ selected: new Set() }),
  setFilter: (f) => set({ filter: f }),
  actOn: (ids, action) => set(s => {
    const updated = s.items.map(it => ids.includes(it.id) ? { ...it, status: nextStatus(it.status as Status, action) } : it);
    return { items: updated };
  })
}));

