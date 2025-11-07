export type Source = 'crm' | 'erp' | 'finance' | 'support' | 'registry';

export type Status =
  | 'suggested'
  | 'confirmed'
  | 'rejected'
  | 'needs_review'
  | 'conflicted';

export interface SourceRecord {
  id: string;
  source: Source;
  fields: {
    name?: string;
    registry_code?: string;
    vat?: string;
    address?: string;
    country?: string;
    phone?: string;
    email?: string;
  };
}

export interface Reason {
  text: string;
  score: number;
  strength: 'strong' | 'moderate' | 'weak';
  field?: string;
  details?: { metric?: string; value?: number; tokens?: string[] };
}

export interface CandidateGroup {
  id: string;
  band: 'veryHigh' | 'high' | 'other';
  confidence: number; // 0..1
  reasons: Reason[];
  records: SourceRecord[]; // includes `registry` record if available
  status: Status;
  reviewer?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface Decision {
  id: string;
  group_id: string;
  actor: string;
  action: 'confirm' | 'reject' | 'needs_review' | 'merge' | 'split';
  rationale?: string;
  timestamp: string;
  before: Status;
  after: Status;
}

export interface ReviewedItem {
  id: string;
  finalRecord: SourceRecord;
  status: Exclude<Status, 'suggested'>;
  confidence: number;
  reviewer: string;
  reviewedAt: string;
}

