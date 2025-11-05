// Mock data for the Human-in-the-Loop Entity Matching System

export interface CompanyRecord {
  source: string;
  name: string;
  vat: string;
  address: string;
  country: string;
  phone: string;
  email: string;
}

export interface MatchPair {
  id: string;
  confidence: number;
  status: 'suggested' | 'confirmed' | 'rejected' | 'needs_review';
  records: CompanyRecord[];
  aiExplanation: {
    nameSimilarity: number;
    vatMatch: boolean;
    addressSimilarity: number;
    phoneSimilarity: number;
    overallScore: number;
  };
  reviewer?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export const currentMatchPairs: MatchPair[] = [
  {
    id: 'match-001',
    confidence: 0.94,
    status: 'suggested',
    records: [
      {
        source: 'CRM',
        name: 'Trinidad Ltd',
        vat: 'GB123456789',
        address: '123 Oxford Street, London',
        country: 'United Kingdom',
        phone: '+44 20 7946 0958',
        email: 'contact@trinidadltd.com'
      },
      {
        source: 'ERP',
        name: 'Trinidad Limited',
        vat: 'GB123456789',
        address: '123 Oxford St, London, UK',
        country: 'United Kingdom',
        phone: '+44 20 7946 0958',
        email: 'info@trinidadltd.co.uk'
      },
      {
        source: 'Finance',
        name: 'Trinidad Ltd.',
        vat: 'GB123456789',
        address: '123 Oxford Street, London W1',
        country: 'UK',
        phone: '+442079460958',
        email: 'accounts@trinidadltd.com'
      },
      {
        source: 'Support',
        name: 'Trinidad',
        vat: 'GB123456789',
        address: '123 Oxford Street',
        country: 'United Kingdom',
        phone: '+44 20 7946 0958',
        email: 'support@trinidad.com'
      },
      {
        source: 'Registry',
        name: 'Trinidad Limited',
        vat: 'GB123456789',
        address: '123 Oxford Street, London, W1D 2HX',
        country: 'United Kingdom',
        phone: '+44 20 7946 0958',
        email: 'legal@trinidadltd.com'
      }
    ],
    aiExplanation: {
      nameSimilarity: 0.94,
      vatMatch: true,
      addressSimilarity: 0.88,
      phoneSimilarity: 0.92,
      overallScore: 0.94
    }
  },
  {
    id: 'match-002',
    confidence: 0.87,
    status: 'suggested',
    records: [
      {
        source: 'CRM',
        name: 'Acme Corporation Inc',
        vat: 'US987654321',
        address: '456 Silicon Valley Blvd, San Francisco, CA',
        country: 'United States',
        phone: '+1 415 555 0123',
        email: 'hello@acmecorp.com'
      },
      {
        source: 'ERP',
        name: 'ACME Corp',
        vat: 'US987654321',
        address: '456 Silicon Valley Boulevard, SF',
        country: 'USA',
        phone: '+1 415 555 0123',
        email: 'contact@acmecorp.com'
      },
      {
        source: 'Finance',
        name: 'Acme Corporation',
        vat: 'US987654321',
        address: '456 Silicon Valley Blvd',
        country: 'United States',
        phone: '+14155550123',
        email: 'billing@acme.com'
      },
      {
        source: 'Support',
        name: 'Acme Inc',
        vat: 'US987654321',
        address: '456 Silicon Valley Blvd, San Francisco',
        country: 'US',
        phone: '+1 415 555 0123',
        email: 'help@acmecorp.com'
      },
      {
        source: 'Registry',
        name: 'Acme Corporation Incorporated',
        vat: 'US987654321',
        address: '456 Silicon Valley Boulevard, San Francisco, CA 94105',
        country: 'United States',
        phone: '+1 415 555 0123',
        email: 'admin@acmecorp.com'
      }
    ],
    aiExplanation: {
      nameSimilarity: 0.87,
      vatMatch: true,
      addressSimilarity: 0.85,
      phoneSimilarity: 0.98,
      overallScore: 0.87
    }
  }
];

export const reviewedMatches: MatchPair[] = [
  {
    id: 'match-101',
    confidence: 0.91,
    status: 'confirmed',
    reviewer: 'Sarah Chen',
    reviewedAt: '2025-11-04T10:30:00',
    records: [
      {
        source: 'CRM',
        name: 'GlobalTech Solutions',
        vat: 'DE111222333',
        address: 'Unter den Linden 1, Berlin',
        country: 'Germany',
        phone: '+49 30 12345678',
        email: 'info@globaltech.de'
      },
      {
        source: 'ERP',
        name: 'GlobalTech Solutions GmbH',
        vat: 'DE111222333',
        address: 'Unter den Linden 1, 10117 Berlin',
        country: 'Germany',
        phone: '+49 30 12345678',
        email: 'contact@globaltech.de'
      },
      {
        source: 'Finance',
        name: 'GlobalTech Solutions',
        vat: 'DE111222333',
        address: 'Unter den Linden 1',
        country: 'DE',
        phone: '+493012345678',
        email: 'finance@globaltech.de'
      },
      {
        source: 'Support',
        name: 'GlobalTech',
        vat: 'DE111222333',
        address: 'Berlin, Germany',
        country: 'Germany',
        phone: '+49 30 12345678',
        email: 'support@globaltech.de'
      },
      {
        source: 'Registry',
        name: 'GlobalTech Solutions GmbH',
        vat: 'DE111222333',
        address: 'Unter den Linden 1, 10117 Berlin, Germany',
        country: 'Germany',
        phone: '+49 30 12345678',
        email: 'legal@globaltech.de'
      }
    ],
    aiExplanation: {
      nameSimilarity: 0.91,
      vatMatch: true,
      addressSimilarity: 0.89,
      phoneSimilarity: 0.95,
      overallScore: 0.91
    }
  },
  {
    id: 'match-102',
    confidence: 0.76,
    status: 'rejected',
    reviewer: 'Elvis Martinez',
    reviewedAt: '2025-11-04T14:05:00',
    rejectionReason: 'VAT mismatch',
    records: [
      {
        source: 'CRM',
        name: 'Trinidad Ltd',
        vat: 'ES999888777',
        address: 'Calle Mayor 15, Madrid',
        country: 'Spain',
        phone: '+34 91 123 4567',
        email: 'contact@trinidad.es'
      },
      {
        source: 'ERP',
        name: 'Trinidad Limited',
        vat: 'GB123456789',
        address: '123 Oxford Street, London',
        country: 'United Kingdom',
        phone: '+44 20 7946 0958',
        email: 'info@trinidadltd.co.uk'
      },
      {
        source: 'Finance',
        name: 'Trinidad Ltd',
        vat: 'ES999888777',
        address: 'Calle Mayor 15',
        country: 'Spain',
        phone: '+34911234567',
        email: 'accounts@trinidad.es'
      },
      {
        source: 'Support',
        name: 'Trinidad',
        vat: 'GB123456789',
        address: 'London, UK',
        country: 'United Kingdom',
        phone: '+44 20 7946 0958',
        email: 'support@trinidad.com'
      },
      {
        source: 'Registry',
        name: 'Trinidad Limited',
        vat: 'GB123456789',
        address: '123 Oxford Street, London',
        country: 'United Kingdom',
        phone: '+44 20 7946 0958',
        email: 'legal@trinidadltd.com'
      }
    ],
    aiExplanation: {
      nameSimilarity: 0.92,
      vatMatch: false,
      addressSimilarity: 0.45,
      phoneSimilarity: 0.38,
      overallScore: 0.76
    }
  }
];

export const rejectionReasons = [
  'VAT mismatch',
  'Different country',
  'Different address',
  'Different phone',
  'Different entity type',
  'Name too different',
  'Duplicate record',
  'Other'
];

export const performanceMetrics = {
  precision: 0.87,
  recall: 0.82,
  f1Score: 0.84,
  totalReviewed: 45,
  totalRecords: 200,
  confirmed: 32,
  rejected: 8,
  needsReview: 5,
  precisionHistory: [
    { date: '2025-10-28', value: 0.78 },
    { date: '2025-10-29', value: 0.79 },
    { date: '2025-10-30', value: 0.81 },
    { date: '2025-10-31', value: 0.83 },
    { date: '2025-11-01', value: 0.84 },
    { date: '2025-11-02', value: 0.85 },
    { date: '2025-11-03', value: 0.86 },
    { date: '2025-11-04', value: 0.87 }
  ],
  recallHistory: [
    { date: '2025-10-28', value: 0.75 },
    { date: '2025-10-29', value: 0.76 },
    { date: '2025-10-30', value: 0.77 },
    { date: '2025-10-31', value: 0.78 },
    { date: '2025-11-01', value: 0.79 },
    { date: '2025-11-02', value: 0.80 },
    { date: '2025-11-03', value: 0.81 },
    { date: '2025-11-04', value: 0.82 }
  ]
};

export const topRejectionReasons = [
  { reason: 'VAT mismatch', count: 15 },
  { reason: 'Different country', count: 12 },
  { reason: 'Different address', count: 8 },
  { reason: 'Name too different', count: 5 },
  { reason: 'Different phone', count: 3 }
];

export const reviewerLeaderboard = [
  { name: 'Sarah Chen', reviews: 156, accuracy: 0.94, avgTime: '2.3 min' },
  { name: 'Elvis Martinez', reviews: 142, accuracy: 0.92, avgTime: '2.7 min' },
  { name: 'Marcus Johnson', reviews: 128, accuracy: 0.89, avgTime: '3.1 min' },
  { name: 'Aisha Patel', reviews: 115, accuracy: 0.91, avgTime: '2.5 min' },
  { name: 'Liu Wei', reviews: 98, accuracy: 0.88, avgTime: '3.4 min' }
];
