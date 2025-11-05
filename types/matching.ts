export type Status = "suggested" | "confirmed" | "rejected" | "needs_review" | "conflicted";

export type ActionKind = "confirm" | "reject" | "merge" | "split";

export interface CandidateGroup {
  id: string;
  confidence: number; // 0..1
  status: Status;
  title: string; // short label for UI
  reasons?: string[];
  // minimal fields to show in list
  summary?: { sources: string[]; vat?: string; registry?: string; };
}

