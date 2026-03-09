import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Check, X, Merge, Scissors, SkipForward, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { rejectionReasons } from '../mockData';
import { ExplainableAIPanel } from './ExplainableAIPanel';
import { useMatches } from '../contexts/MatchContext';
import { BatchPanel } from './BatchPanel';
import { toast } from './ui/sonner';
import type { SourceRecord } from '../src/types/hitl';

// ─── Design tokens ────────────────────────────────────────────────────────────
const token = {
  fontDisplay: "'Playfair Display', Georgia, serif",
  fontBody: "'DM Sans', 'Segoe UI', sans-serif",
  indigo: '#6366f1',
  indigoLight: '#e0e7ff',
  indigoMid: '#c7d2fe',
  green: '#22c55e',
  greenLight: '#dcfce7',
  greenDark: '#166534',
  amber: '#f59e0b',
  amberLight: '#fef3c7',
  red: '#ef4444',
  redLight: '#fee2e2',
  surface: '#ffffff',
  bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e9f0ff 100%)',
  border: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  radius: 18,
  radiusSm: 12,
  radiusXs: 8,
  shadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
  shadowRing: '0 0 0 2px #6366f1, 0 8px 32px rgba(99,102,241,0.12)',
  shadowModal: '0 32px 80px rgba(15,23,42,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
};

// ─── Confidence Ring ──────────────────────────────────────────────────────────
function ConfidenceRing({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 85 ? token.green : pct >= 65 ? token.amber : token.red;
  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
      <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke={token.border} strokeWidth="5" />
        <circle
          cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color, lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontSize: 9, color: token.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>conf.</span>
      </div>
    </div>
  );
}

// ─── Field status helper ──────────────────────────────────────────────────────
function getFieldStatus(field: string, records: SourceRecord[]) {
  const values = records.map(r => r.fields[field as keyof typeof r.fields] || '');
  const normalized = values.map(v => String(v).toLowerCase().replace(/[^a-z0-9]/g, ''));
  const allSame = normalized.length > 0 && normalized.every(v => v === normalized[0] && v !== '');
  return allSame ? 'match' : 'partial';
}

// ─── Status dot ───────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const bg = status === 'match' ? token.green : status === 'partial' ? token.amber : token.border;
  return <div style={{ width: 6, height: 6, borderRadius: 99, background: bg, flexShrink: 0, marginTop: 1 }} />;
}

// ─── Shared button style helper ───────────────────────────────────────────────
function btnStyle(variant: 'confirm' | 'reject' | 'merge' | 'split' | 'skip' | 'ghost'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '10px 20px', borderRadius: token.radiusSm, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.15s ease',
    letterSpacing: '0.01em', fontFamily: token.fontBody,
  };
  const variants: Record<string, React.CSSProperties> = {
    confirm: { background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', boxShadow: '0 4px 14px rgba(34,197,94,0.3)' },
    reject:  { background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' },
    merge:   { background: token.surface, color: token.indigo, border: `1.5px solid ${token.indigoMid}`, boxShadow: token.shadow },
    split:   { background: token.surface, color: token.amber, border: `1.5px solid #fde68a`, boxShadow: token.shadow },
    skip:    { background: '#f8fafc', color: token.textSecondary, border: `1.5px solid ${token.border}` },
    ghost:   { background: 'transparent', color: token.indigo, border: `1.5px solid ${token.indigoMid}` },
  };
  return { ...base, ...(variants[variant] || {}) };
}

// ─── Radio card ───────────────────────────────────────────────────────────────
function RadioCard({
  checked, onClick, label, sublabel,
}: {
  checked: boolean; onClick: () => void; label: string; sublabel?: string;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        border: checked ? `1.5px solid ${token.indigo}` : `1.5px solid ${token.border}`,
        background: checked ? '#f0f4ff' : '#f8fafc',
        borderRadius: token.radiusSm, padding: '12px 16px', cursor: 'pointer',
        transition: 'all 0.15s ease', display: 'flex', alignItems: 'flex-start', gap: 12,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: 99, flexShrink: 0, marginTop: 1,
        border: checked ? 'none' : `2px solid ${token.textMuted}`,
        background: checked ? token.indigo : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <div style={{ width: 7, height: 7, borderRadius: 99, background: '#fff' }} />}
      </div>
      <div>
        <div style={{ fontSize: 14, color: token.textPrimary, fontWeight: checked ? 600 : 400 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: token.textMuted, marginTop: 2 }}>{sublabel}</div>}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ReviewerScreen() {
  const { candidates, confirm, reject, needsReview, merge, split } = useMatches();

  const suggestedCandidates = useMemo(
    () => candidates.filter(c => c.status === 'suggested'),
    [candidates],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [showExplainableAI, setShowExplainableAI] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMergeConfirmModal, setShowMergeConfirmModal] = useState(false);
  const [showMergeSuccessModal, setShowMergeSuccessModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [selectedRecordsToSplit, setSelectedRecordsToSplit] = useState<Set<string>>(new Set());
  const [goldenOverrides, setGoldenOverrides] = useState<Record<string, string>>({});

  const totalRecords = candidates.length;
  const reviewedCount = candidates.filter(c => c.status !== 'suggested').length;
  const progress = totalRecords > 0 ? (reviewedCount / totalRecords) * 100 : 0;
  const currentGroup = suggestedCandidates.length > 0
    ? (suggestedCandidates[currentIndex] || suggestedCandidates[0])
    : null;

  const reviewerName = 'Current User';

  const handleNext = useCallback(() => {
    if (suggestedCandidates.length > 0) {
      setCurrentIndex(prev => (prev + 1) % suggestedCandidates.length);
    }
  }, [suggestedCandidates.length]);

  const handleConfirm = useCallback(() => { setShowConfirmModal(true); }, []);

  const executeConfirm = useCallback(() => {
    if (!currentGroup) return;
    confirm(currentGroup.id, goldenOverrides);
    setShowConfirmModal(false);
    setGoldenOverrides({});
    toast.success(`Group ${currentGroup.id} confirmed successfully.`);
    handleNext();
  }, [currentGroup, confirm, goldenOverrides, handleNext]);

  const handleReject = useCallback(() => { setShowRejectionDialog(true); }, []);
  const handleMerge  = useCallback(() => { setShowMergeConfirmModal(true); }, []);
  const handleSplit  = useCallback(() => { setShowSplitModal(true); }, []);

  const executeMerge = useCallback(() => {
    if (!currentGroup) return;
    merge(currentGroup.id);
    setShowMergeConfirmModal(false);
    setShowMergeSuccessModal(true);
    toast.success(`Group ${currentGroup.id} merged successfully.`);
  }, [currentGroup, merge]);

  const executeSplit = useCallback(() => {
    if (!currentGroup) return;
    split(currentGroup.id);
    setShowSplitModal(false);
    toast.success(`Group ${currentGroup.id} split successfully.`);
    handleNext();
  }, [currentGroup, split, handleNext]);

  const submitRejection = useCallback(() => {
    if (selectedReason && currentGroup) {
      reject(currentGroup.id);
      setShowRejectionDialog(false);
      setSelectedReason('');
      toast.success(`Group ${currentGroup.id} rejected successfully.`);
      handleNext();
    }
  }, [selectedReason, currentGroup, reject, handleNext]);

  const getDefaultSourceForField = useCallback((field: string): string | null => {
    if (!currentGroup) return null;
    const valuesBySource: Record<string, string> = {};
    currentGroup.records.forEach(r => {
      const val = r.fields[field as keyof typeof r.fields];
      if (val && String(val).trim()) valuesBySource[r.source] = String(val);
    });
    if (Object.keys(valuesBySource).length <= 1) return null;
    const priorityOrder = ['registry', 'erp', 'crm', 'website', 'manual'];
    for (const src of priorityOrder) {
      if (valuesBySource[src]) return src;
    }
    return Object.keys(valuesBySource)[0] || null;
  }, [currentGroup]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (showRejectionDialog || showSuccessDialog || showConfirmModal || showMergeConfirmModal || showMergeSuccessModal || showSplitModal) return;
      switch (e.key.toLowerCase()) {
        case 'c': e.preventDefault(); handleConfirm(); break;
        case 'x': e.preventDefault(); handleReject(); break;
        case 'm': e.preventDefault(); handleMerge(); break;
        case 'd': e.preventDefault(); handleSplit(); break;
        case 'n': e.preventDefault(); handleNext(); break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    showRejectionDialog, showSuccessDialog, showConfirmModal,
    showMergeConfirmModal, showMergeSuccessModal, showSplitModal,
    handleConfirm, handleReject, handleMerge, handleSplit, handleNext,
  ]);

  const fields = ['name', 'vat', 'address', 'country', 'phone', 'email'] as const;

  return (
    <>
      {/* ── Google Fonts + animations ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0;transform:translateY(12px) } to { opacity:1;transform:translateY(0) } }
        .rev-btn:hover { filter: brightness(0.94); transform: translateY(-1px); }
        .rev-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.1) !important; }
        ::-webkit-scrollbar { width:6px;height:6px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:#cbd5e1;border-radius:99px }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: token.bg,
        fontFamily: token.fontBody,
        paddingTop: 96, paddingBottom: 48, paddingLeft: 24, paddingRight: 24,
      }}>
        <div style={{ maxWidth: 1600, margin: '0 auto' }}>

          {/* ── Page header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div style={{ fontFamily: token.fontDisplay, fontSize: 22, fontWeight: 700, color: token.textPrimary, letterSpacing: '-0.5px' }}>
              Entity Review
              <span style={{ fontSize: 13, fontWeight: 400, color: token.textMuted, marginLeft: 8 }}>· Human-in-the-loop</span>
            </div>
            {currentGroup && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: token.textMuted }}>Current Group</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: token.textPrimary }}>{currentGroup.id}</div>
                </div>
                <ConfidenceRing value={currentGroup.confidence || 0} />
              </div>
            )}
          </div>

          {/* ── Progress card ── */}
          <Card style={{
            marginBottom: 24, padding: '20px 28px',
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
            border: `1px solid ${token.border}`,
            boxShadow: token.shadow, borderRadius: token.radius,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: token.textPrimary }}>Review Progress</span>
                <span style={{ marginLeft: 10, fontSize: 13, color: token.textSecondary }}>
                  {reviewedCount} of {totalRecords} reviewed — {Math.round(progress)}% complete
                </span>
              </div>
              {currentGroup && (
                <Badge style={{
                  background: `linear-gradient(135deg,${token.indigo},#8b5cf6)`,
                  color: '#fff', padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700,
                }}>
                  Confidence: {Math.round((currentGroup.confidence || 0) * 100)}%
                </Badge>
              )}
            </div>
            <Progress value={progress} style={{ height: 6, borderRadius: 99 }} />

            {/* Inline reason pills */}
            {currentGroup?.reasons && currentGroup.reasons.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {currentGroup.reasons.slice(0, 4).map((r, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 600,
                    background: r.score > 0 ? token.greenLight : token.redLight,
                    color: r.score > 0 ? token.greenDark : '#991b1b',
                    border: `1px solid ${r.score > 0 ? '#86efac' : '#fca5a5'}`,
                  }}>
                    {r.text}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* ── Batch Panel (unchanged) ── */}
          <BatchPanel />

          {/* ── Empty state ── */}
          {!currentGroup ? (
            <Card style={{
              padding: '80px 40px', textAlign: 'center',
              background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)',
              border: `1px solid ${token.border}`, boxShadow: token.shadow, borderRadius: token.radius,
            }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>✓</div>
              <div style={{ fontFamily: token.fontDisplay, fontSize: 24, fontWeight: 700, color: token.textPrimary, marginBottom: 8 }}>
                {suggestedCandidates.length === 0 && candidates.length === 0
                  ? 'No candidates available'
                  : 'All matches reviewed!'}
              </div>
              <p style={{ color: token.textSecondary }}>
                {suggestedCandidates.length === 0 && candidates.length === 0
                  ? 'Start by loading mock data in the Admin page.'
                  : "You've completed reviewing all pending matches."}
              </p>
            </Card>
          ) : (
            <>
              {/* ── Record cards ── */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${currentGroup.records.length}, 1fr)`,
                gap: 16, marginBottom: 16,
              }}>
                {currentGroup.records.map((record, idx) => {
                  const isRegistry = record.source === 'registry';
                  const sourceName = record.source.charAt(0).toUpperCase() + record.source.slice(1);
                  return (
                    <div
                      key={idx}
                      className="rev-card"
                      style={{
                        background: token.surface,
                        borderRadius: token.radius,
                        boxShadow: isRegistry ? token.shadowRing : token.shadow,
                        overflow: 'hidden',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                    >
                      {/* Card header */}
                      <div style={{
                        padding: '14px 20px',
                        background: isRegistry
                          ? 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)'
                          : 'linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%)',
                        borderBottom: isRegistry ? 'none' : `1px solid ${token.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <Badge style={{
                          background: isRegistry
                            ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                            : 'linear-gradient(135deg,#3b82f6,#6366f1)',
                          color: '#fff', fontSize: 12, fontWeight: 700,
                          letterSpacing: '0.04em', textTransform: 'uppercase',
                          padding: '4px 12px', borderRadius: 99,
                        }}>
                          {sourceName}
                        </Badge>
                        {isRegistry && (
                          <span style={{
                            background: 'rgba(255,255,255,0.22)', color: '#fff',
                            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                            padding: '2px 10px', borderRadius: 99, textTransform: 'uppercase',
                          }}>
                            Primary
                          </span>
                        )}
                      </div>

                      {/* Card body */}
                      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {fields.map(field => {
                          const val = record.fields[field as keyof typeof record.fields];
                          const status = getFieldStatus(field, currentGroup.records);
                          const isHovered = hoveredField === field;
                          return (
                            <div
                              key={field}
                              onMouseEnter={() => setHoveredField(field)}
                              onMouseLeave={() => setHoveredField(null)}
                              style={{
                                padding: '10px 12px', borderRadius: 10,
                                background: isHovered ? '#f0f4ff' : '#f8fafc',
                                border: isHovered ? `1px solid ${token.indigoMid}` : '1px solid transparent',
                                transition: 'all 0.15s ease',
                                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                                <StatusDot status={status} />
                                <div style={{
                                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                                  textTransform: 'uppercase', color: token.textMuted,
                                }}>
                                  {field}
                                </div>
                              </div>
                              <div style={{
                                fontSize: 13, fontWeight: 500, color: val ? token.textPrimary : token.textMuted,
                                fontStyle: val ? 'normal' : 'italic', wordBreak: 'break-word', lineHeight: 1.4,
                              }}>
                                {val || '(not provided)'}
                              </div>
                              {field !== 'phone' && field !== 'email' && status === 'match' && (
                                <Badge style={{
                                  marginTop: 6, background: token.greenLight, color: token.greenDark,
                                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                                  border: `1px solid #86efac`,
                                }}>
                                  ✓ Match
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Field legend ── */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 20, fontSize: 12, color: token.textMuted }}>
                {([
                  [token.green, 'Fields match'],
                  [token.amber, 'Conflict detected'],
                  [token.border, 'No data'],
                ] as [string, string][]).map(([color, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 99, background: color }} />
                    {label}
                  </div>
                ))}
              </div>

              {/* ── Action buttons ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <Button
                  onClick={() => setShowExplainableAI(true)}
                  variant="outline"
                  className="rev-btn"
                  style={{
                    borderColor: token.indigoMid, color: token.indigo,
                    background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)',
                    borderRadius: token.radiusSm, fontFamily: token.fontBody, fontWeight: 600,
                  }}
                >
                  <Info className="w-4 h-4 mr-2" />
                  Why this match?
                </Button>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="rev-btn" style={btnStyle('confirm')} onClick={handleConfirm}>
                    <Check size={16} /> Confirm
                  </button>
                  <button className="rev-btn" style={btnStyle('reject')} onClick={handleReject}>
                    <X size={16} /> Reject
                  </button>
                  <button className="rev-btn" style={btnStyle('merge')} onClick={handleMerge}>
                    <Merge size={16} /> Merge
                  </button>
                  <button className="rev-btn" style={btnStyle('split')} onClick={handleSplit}>
                    <Scissors size={16} /> Split
                  </button>
                  <button className="rev-btn" style={btnStyle('skip')} onClick={handleNext}>
                    <SkipForward size={16} /> Skip
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Keyboard shortcuts bar ── */}
          <Card style={{
            marginTop: 24, padding: '12px 24px',
            background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)',
            border: `1px solid rgba(99,102,241,0.14)`,
            borderRadius: token.radiusSm,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 28, flexWrap: 'wrap',
          }}>
            {([['C', 'Confirm'], ['X', 'Reject'], ['M', 'Merge'], ['D', 'Split'], ['N', 'Next']] as [string, string][]).map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: token.textSecondary }}>
                <kbd style={{
                  background: token.surface, border: `1px solid ${token.border}`,
                  borderRadius: 6, padding: '2px 8px', fontSize: 12,
                  fontFamily: 'monospace', fontWeight: 700, color: token.textSecondary,
                  boxShadow: `0 1px 0 ${token.border}`,
                }}>
                  {key}
                </kbd>
                <span>{label}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          REJECTION DIALOG  (original logic, restyled)
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent style={{
          background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(16px)',
          borderRadius: token.radius, boxShadow: token.shadowModal,
          fontFamily: token.fontBody, maxWidth: 480,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          maxHeight: '90vh', padding: 0,
        }}>
          {/* Sticky header */}
          <div style={{
            padding: '24px 28px 16px', borderBottom: `1px solid ${token.border}`,
            flexShrink: 0, background: token.surface,
            borderRadius: `${token.radius}px ${token.radius}px 0 0`,
          }}>
            <div style={{ fontFamily: token.fontDisplay, fontSize: 20, fontWeight: 700, color: token.textPrimary }}>
              Reject Match
            </div>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
            {currentGroup?.reasons && currentGroup.reasons.length > 0 && (
              <div style={{
                marginBottom: 16, padding: '12px 16px',
                background: '#fff7f7', borderRadius: 10, border: '1px solid #fca5a5',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Issues</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: '#b91c1c', fontSize: 13, lineHeight: 1.6 }}>
                  {currentGroup.reasons.filter(r => r.score < 0 || r.strength === 'weak').slice(0, 3).map((reason, idx) => (
                    <li key={idx}>{reason.text}</li>
                  ))}
                </ul>
              </div>
            )}

            <Label style={{ fontSize: 13, fontWeight: 600, color: token.textSecondary, display: 'block', marginBottom: 10 }}>
              Select Rejection Reason
            </Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rejectionReasons.map(reason => (
                <RadioCard
                  key={reason}
                  checked={selectedReason === reason}
                  onClick={() => setSelectedReason(reason)}
                  label={reason}
                />
              ))}
            </RadioGroup>
          </div>

          {/* Sticky footer */}
          <div style={{
            padding: '16px 28px 24px', borderTop: `1px solid ${token.border}`,
            flexShrink: 0, background: token.surface,
            borderRadius: `0 0 ${token.radius}px ${token.radius}px`,
            display: 'flex', gap: 10,
          }}>
            <Button
              onClick={submitRejection}
              disabled={!selectedReason}
              style={{
                flex: 1, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff',
                borderRadius: token.radiusSm, fontWeight: 600, fontFamily: token.fontBody,
                opacity: !selectedReason ? 0.5 : 1,
              }}
            >
              Submit Rejection
            </Button>
            <Button
              onClick={() => setShowRejectionDialog(false)}
              variant="outline"
              style={{ flex: 1, borderRadius: token.radiusSm, fontFamily: token.fontBody }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          CONFIRM MODAL — with golden value selection (original logic, restyled)
          Layout: sticky header + scrollable body + sticky footer so nothing is clipped
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent style={{
          background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(16px)',
          borderRadius: token.radius, boxShadow: token.shadowModal,
          fontFamily: token.fontBody, maxWidth: 860,
          /* Remove default overflow so we control it per-section */
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          maxHeight: '90vh',
          padding: 0,
        }}>

          {/* ── Sticky header ── */}
          <div style={{
            padding: '24px 28px 16px',
            borderBottom: `1px solid ${token.border}`,
            flexShrink: 0,
            background: token.surface,
            borderRadius: `${token.radius}px ${token.radius}px 0 0`,
          }}>
            <div style={{ fontFamily: token.fontDisplay, fontSize: 20, fontWeight: 700, color: token.textPrimary }}>
              Confirm Match &amp; Choose Golden Values
            </div>
            <p style={{ fontSize: 13, color: token.textSecondary, marginTop: 4, marginBottom: 0 }}>
              Confirm this is a correct match. Optionally select which source's value to keep for each field.
            </p>
          </div>

          {/* ── Scrollable body ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
            {currentGroup && (
              <div>
                {/* Summary row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16,
                  background: '#f8fafc', borderRadius: token.radiusSm, padding: '14px 18px', marginBottom: 20,
                }}>
                  {[
                    ['Group ID', currentGroup.id],
                    ['Confidence', `${(currentGroup.confidence * 100).toFixed(0)}%`],
                    ['Records', currentGroup.records.length],
                  ].map(([k, v]) => (
                    <div key={String(k)}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: token.textMuted }}>{k}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: token.textPrimary }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Golden values */}
                <div style={{
                  border: `1px solid ${token.border}`, borderRadius: token.radius,
                  padding: '20px 22px', background: '#f8fafc', marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: token.textPrimary, margin: 0 }}>Golden Record Values</h4>
                    <Badge variant="outline" style={{ fontSize: 11, color: token.textMuted, borderColor: token.border }}>
                      Leave blank to use system defaults
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {fields.map(field => {
                      const defaultSource = getDefaultSourceForField(field);
                      const fieldValues = currentGroup.records
                        .map(r => ({
                          source: r.source,
                          value: (r.fields[field as keyof typeof r.fields] || '').toString().trim(),
                        }))
                        .filter(v => v.value);

                      const uniqueValues = new Set(fieldValues.map(v => v.value));
                      const hasConflict = uniqueValues.size > 1 && fieldValues.length > 1;
                      if (!hasConflict && fieldValues.length === 0) return null;

                      const currentChoice = goldenOverrides[field] || defaultSource || '';

                      return (
                        <div key={field}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize', color: token.textPrimary }}>{field}</span>
                            {hasConflict
                              ? <span style={{ fontSize: 11, background: token.amberLight, color: '#92400e', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>Conflict</span>
                              : <span style={{ fontSize: 11, background: token.greenLight, color: token.greenDark, padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>All match</span>
                            }
                          </div>

                          {hasConflict ? (
                            <RadioGroup
                              value={currentChoice}
                              onValueChange={src => setGoldenOverrides(prev => ({ ...prev, [field]: src }))}
                              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}
                            >
                              {fieldValues.map(({ source, value }) => (
                                <div
                                  key={`${field}-${source}`}
                                  onClick={() => setGoldenOverrides(prev => ({ ...prev, [field]: source }))}
                                  style={{
                                    border: currentChoice === source ? `1.5px solid ${token.indigo}` : `1.5px solid ${token.border}`,
                                    background: currentChoice === source ? '#f0f4ff' : token.surface,
                                    borderRadius: token.radiusSm, padding: '12px 14px', cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                    <RadioGroupItem value={source} id={`${field}-${source}`} style={{ marginTop: 2 }} />
                                    <div>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: token.indigo, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{source}</div>
                                      <div style={{ fontSize: 13, color: token.textPrimary, marginTop: 2, fontWeight: 500, wordBreak: 'break-word' }}>{value}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </RadioGroup>
                          ) : (
                            <div style={{
                              background: '#f0fdf4', borderRadius: 10,
                              padding: '10px 14px', fontSize: 13, color: token.textPrimary,
                              border: '1px solid #bbf7d0', fontWeight: 500,
                            }}>
                              {fieldValues[0]?.value || '(empty)'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Match reasons */}
                {currentGroup.reasons && currentGroup.reasons.length > 0 && (
                  <div style={{ paddingTop: 16, borderTop: `1px solid ${token.border}` }}>
                    <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: token.textSecondary }}>Match Reasons</h5>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {currentGroup.reasons.slice(0, 5).map((reason, idx) => (
                        <li key={idx} style={{ fontSize: 13, color: token.textSecondary }}>
                          {reason.text}{' '}
                          <span style={{ color: token.textMuted }}>({reason.strength})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Sticky footer ── */}
          <div style={{
            padding: '16px 28px 24px',
            borderTop: `1px solid ${token.border}`,
            flexShrink: 0,
            background: token.surface,
            borderRadius: `0 0 ${token.radius}px ${token.radius}px`,
            display: 'flex', justifyContent: 'flex-end', gap: 10,
          }}>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}
              style={{ borderRadius: token.radiusSm, fontFamily: token.fontBody }}>
              Cancel
            </Button>
            <Button
              onClick={executeConfirm}
              style={{
                background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff',
                minWidth: 160, borderRadius: token.radiusSm,
                fontFamily: token.fontBody, fontWeight: 700,
                boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
              }}
            >
              <Check size={16} style={{ marginRight: 6 }} /> Confirm Match
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          MERGE CONFIRMATION MODAL (original logic, restyled)
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={showMergeConfirmModal} onOpenChange={setShowMergeConfirmModal}>
        <DialogContent style={{
          background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(16px)',
          borderRadius: token.radius, boxShadow: token.shadowModal,
          fontFamily: token.fontBody, maxWidth: 480,
        }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: token.fontDisplay, fontSize: 20, fontWeight: 700, color: token.textPrimary }}>
              Merge Records
            </DialogTitle>
          </DialogHeader>
          {currentGroup && (
            <div>
              <p style={{ fontSize: 14, color: token.textSecondary, lineHeight: 1.6, marginBottom: 16 }}>
                These records will be merged into one entity. Are you sure you want to <strong>Merge</strong> this match?
              </p>
              <div style={{ background: '#f8fafc', borderRadius: token.radiusSm, padding: '14px 16px', marginBottom: 16 }}>
                {[
                  ['Group ID', currentGroup.id],
                  ['Confidence', `${(currentGroup.confidence * 100).toFixed(0)}%`],
                ].map(([k, v]) => (
                  <div key={String(k)} style={{ fontSize: 13, color: token.textSecondary, marginBottom: 4 }}>
                    <strong>{k}:</strong> {v}
                  </div>
                ))}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: token.textMuted, marginBottom: 6 }}>Sources to merge</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {currentGroup.records.map(r => (
                      <span key={r.source} style={{
                        background: token.indigoLight, color: '#4338ca',
                        padding: '4px 12px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                      }}>
                        {r.source}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: token.textMuted }}>
                  Merging will create a unified entity and mark this match as Confirmed.
                </div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={() => setShowMergeConfirmModal(false)} variant="outline"
              style={{ flex: 1, borderRadius: token.radiusSm, fontFamily: token.fontBody }}>
              Cancel
            </Button>
            <Button onClick={executeMerge} style={{
              flex: 1, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff',
              borderRadius: token.radiusSm, fontFamily: token.fontBody, fontWeight: 700,
            }}>
              <Merge size={16} style={{ marginRight: 6 }} /> Merge
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          MERGE SUCCESS MODAL (original logic, restyled)
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={showMergeSuccessModal} onOpenChange={setShowMergeSuccessModal}>
        <DialogContent style={{
          background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(16px)',
          borderRadius: token.radius, boxShadow: token.shadowModal,
          fontFamily: token.fontBody, maxWidth: 400,
        }}>
          <div style={{ textAlign: 'center', padding: '28px 16px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 99,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
            }}>
              <Merge size={28} color="#fff" />
            </div>
            <div style={{ fontFamily: token.fontDisplay, fontSize: 22, fontWeight: 700, color: token.textPrimary, marginBottom: 8 }}>
              Merge Successful
            </div>
            <p style={{ fontSize: 14, color: token.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
              The records were merged successfully and marked as <strong>Confirmed</strong>.
            </p>
            <Button
              onClick={() => { setShowMergeSuccessModal(false); handleNext(); }}
              style={{
                background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff',
                borderRadius: token.radiusSm, fontFamily: token.fontBody, fontWeight: 700,
                padding: '10px 40px',
              }}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          SPLIT MODAL (original logic, restyled)
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={showSplitModal} onOpenChange={open => {
        setShowSplitModal(open);
        if (!open) setSelectedRecordsToSplit(new Set());
      }}>
        <DialogContent style={{
          background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(16px)',
          borderRadius: token.radius, boxShadow: token.shadowModal,
          fontFamily: token.fontBody, maxWidth: 560,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          maxHeight: '90vh', padding: 0,
        }}>
          {/* Sticky header */}
          <div style={{
            padding: '24px 28px 16px', borderBottom: `1px solid ${token.border}`,
            flexShrink: 0, background: token.surface,
            borderRadius: `${token.radius}px ${token.radius}px 0 0`,
          }}>
            <div style={{ fontFamily: token.fontDisplay, fontSize: 20, fontWeight: 700, color: token.textPrimary }}>
              Split Match
            </div>
            <p style={{ fontSize: 13, color: token.textSecondary, marginTop: 4, marginBottom: 0 }}>
              Select which records to separate into their own entities.
            </p>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
            {currentGroup && (
              <div>
                <div style={{ fontSize: 13, color: token.textSecondary, marginBottom: 14 }}>
                  <strong>Group ID:</strong> {currentGroup.id} &nbsp;·&nbsp;
                  <strong>Confidence:</strong> {(currentGroup.confidence * 100).toFixed(0)}%
                </div>
                <div style={{ border: `1px solid ${token.border}`, borderRadius: token.radiusSm, overflow: 'hidden' }}>
                  {currentGroup.records.map((record, idx) => {
                    const recordId = `${record.source}-${idx}`;
                    const checked = selectedRecordsToSplit.has(recordId);
                    return (
                      <label
                        key={idx}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '14px 16px', cursor: 'pointer',
                          borderBottom: idx < currentGroup.records.length - 1 ? `1px solid ${token.border}` : 'none',
                          background: checked ? '#f0f4ff' : 'transparent',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                          border: checked ? 'none' : `2px solid ${token.textMuted}`,
                          background: checked ? token.indigo : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {checked && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          style={{ display: 'none' }}
                          onChange={e => {
                            const newSet = new Set(selectedRecordsToSplit);
                            e.target.checked ? newSet.add(recordId) : newSet.delete(recordId);
                            setSelectedRecordsToSplit(newSet);
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: token.textPrimary }}>
                            {record.source}: {record.fields.name || 'Unknown'}
                          </div>
                          <div style={{ fontSize: 12, color: token.textMuted }}>
                            {record.fields.vat || 'N/A'} · {record.fields.country || 'N/A'}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div style={{
            padding: '16px 28px 24px', borderTop: `1px solid ${token.border}`,
            flexShrink: 0, background: token.surface,
            borderRadius: `0 0 ${token.radius}px ${token.radius}px`,
            display: 'flex', gap: 10,
          }}>
            <Button
              onClick={() => { setShowSplitModal(false); setSelectedRecordsToSplit(new Set()); }}
              variant="outline"
              style={{ flex: 1, borderRadius: token.radiusSm, fontFamily: token.fontBody }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedRecordsToSplit.size > 0) {
                  executeSplit();
                  setSelectedRecordsToSplit(new Set());
                }
              }}
              disabled={selectedRecordsToSplit.size === 0}
              style={{
                flex: 1,
                background: selectedRecordsToSplit.size > 0
                  ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                  : '#e2e8f0',
                color: selectedRecordsToSplit.size > 0 ? '#fff' : token.textMuted,
                borderRadius: token.radiusSm, fontFamily: token.fontBody, fontWeight: 700,
                cursor: selectedRecordsToSplit.size === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <Scissors size={16} style={{ marginRight: 6 }} />
              Split Selected ({selectedRecordsToSplit.size})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          EXPLAINABLE AI PANEL (unchanged component)
      ══════════════════════════════════════════════════════════ */}
      <ExplainableAIPanel
        isOpen={showExplainableAI}
        onClose={() => setShowExplainableAI(false)}
        matchData={currentGroup}
      />
    </>
  );
}