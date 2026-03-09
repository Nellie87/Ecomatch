import React, { useState, useMemo } from 'react';
import { Search, Filter, Undo2, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useMatches } from '../contexts/MatchContext';
import { toast } from './ui/sonner';
import type { ReviewedItem } from '../src/types/hitl';

// ─── Design tokens (shared with ReviewerScreen) ───────────────────────────────
const token = {
  fontDisplay: "'Playfair Display', Georgia, serif",
  fontBody:    "'DM Sans', 'Segoe UI', sans-serif",
  indigo:      '#6366f1',
  indigoLight: '#e0e7ff',
  indigoMid:   '#c7d2fe',
  green:       '#22c55e',
  greenLight:  '#dcfce7',
  greenDark:   '#166534',
  amber:       '#f59e0b',
  amberLight:  '#fef3c7',
  red:         '#ef4444',
  redLight:    '#fee2e2',
  surface:     '#ffffff',
  bg:          'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e9f0ff 100%)',
  border:      '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary:'#475569',
  textMuted:   '#94a3b8',
  radius:      18,
  radiusSm:    12,
  radiusXs:    8,
  shadow:      '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
  shadowRing:  '0 0 0 2px #6366f1, 0 8px 32px rgba(99,102,241,0.12)',
  shadowModal: '0 32px 80px rgba(15,23,42,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
};

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  confirmed:   { bg: token.greenLight, color: token.greenDark, dot: token.green,  label: 'Confirmed'    },
  rejected:    { bg: token.redLight,   color: '#991b1b',       dot: token.red,    label: 'Rejected'     },
  needs_review:{ bg: token.amberLight, color: '#92400e',       dot: token.amber,  label: 'Needs Review' },
  merged:      { bg: token.indigoLight,color: '#3730a3',       dot: token.indigo, label: 'Merged'       },
};
const getStatus = (s: string) => statusConfig[s] || { bg: '#f1f5f9', color: token.textSecondary, dot: token.textMuted, label: s };

// ─── Confidence mini-bar ──────────────────────────────────────────────────────
function ConfBar({ value }: { value: number }) {
  const pct   = Math.round(value * 100);
  const color = pct >= 90 ? token.green : pct >= 70 ? token.amber : token.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ width: 64, height: 5, background: token.border, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%</span>
    </div>
  );
}

// ─── Pill filter button ───────────────────────────────────────────────────────
function PillBtn({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: token.fontBody,
        border: active ? 'none' : `1.5px solid ${token.border}`,
        background: active ? token.indigo : token.surface,
        color: active ? '#fff' : token.textSecondary,
        boxShadow: active ? '0 2px 8px rgba(99,102,241,0.25)' : 'none',
      }}
    >
      {children}
      {active && <X size={10} />}
    </button>
  );
}

// ─── Tab trigger style helper ─────────────────────────────────────────────────
function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 18px', borderRadius: token.radiusSm, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.15s ease',
    fontFamily: token.fontBody, display: 'inline-flex', alignItems: 'center', gap: 6,
    background: active ? token.indigo : 'transparent',
    color: active ? '#fff' : token.textSecondary,
    boxShadow: active ? '0 2px 8px rgba(99,102,241,0.25)' : 'none',
  };
}

// ─── Main component ───────────────────────────────────────────────────────────
export function MatchManagement() {
  const { reviewed, candidates, filters, setFilters, undo } = useMatches();

  const [expandedRows, setExpandedRows]           = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery]             = useState('');
  const [activeTab, setActiveTab]                 = useState('all');
  const [confidenceFilter, setConfidenceFilter]   = useState<'high' | 'low' | null>(null);
  const [dateFilter, setDateFilter]               = useState<'week' | 'month' | null>(null);
  const [pickRegistryDialogOpen, setPickRegistryDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId]     = useState<string | null>(null);

  // ── Enrich reviewed items with full candidate records ──
  const enrichedReviewed = useMemo(() => {
    return reviewed.map(item => {
      const candidate = candidates.find(c => c.id === item.id);
      return {
        ...item,
        records: candidate?.records || [item.finalRecord],
        band: item.confidence > 0.9 ? 'veryHigh' as const
            : item.confidence > 0.8 ? 'high' as const
            : 'other' as const,
      };
    });
  }, [reviewed, candidates]);

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedRows(next);
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // ── Client-side filtering (original logic untouched) ──
  const filteredMatches = useMemo(() => {
    let filtered = [...enrichedReviewed];

    if (activeTab === 'confirmed' || activeTab === 'accepted') {
      filtered = filtered.filter(item => item.status === 'confirmed');
    } else if (activeTab === 'rejected') {
      filtered = filtered.filter(item => item.status === 'rejected');
    } else if (activeTab === 'needs_review') {
      filtered = filtered.filter(item => item.status === 'needs_review');
    }

    if (confidenceFilter === 'high') {
      filtered = filtered.filter(item => item.confidence > 0.9);
    } else if (confidenceFilter === 'low') {
      filtered = filtered.filter(item => item.confidence < 0.8);
    }

    if (dateFilter === 'week') {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(item => new Date(item.reviewedAt) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
      filtered = filtered.filter(item => new Date(item.reviewedAt) >= monthAgo);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const f = item.finalRecord.fields;
        return (
          f.name?.toLowerCase().includes(query) ||
          f.vat?.toLowerCase().includes(query) ||
          f.country?.toLowerCase().includes(query) ||
          item.reviewer?.toLowerCase().includes(query) ||
          item.finalRecord.source.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [enrichedReviewed, activeTab, confidenceFilter, dateFilter, searchQuery]);

  // ── Counts for tab badges ──
  const counts = useMemo(() => ({
    all:          enrichedReviewed.length,
    confirmed:    enrichedReviewed.filter(i => i.status === 'confirmed').length,
    rejected:     enrichedReviewed.filter(i => i.status === 'rejected').length,
    needs_review: enrichedReviewed.filter(i => i.status === 'needs_review').length,
  }), [enrichedReviewed]);

  // ── Render match list ──
  const renderMatchList = (matches: typeof filteredMatches) => {
    if (!matches || matches.length === 0) {
      return (
        <div style={{
          padding: '64px 40px', textAlign: 'center',
          background: token.surface, borderRadius: token.radius,
          boxShadow: token.shadow, border: `1px solid ${token.border}`,
        }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
          <div style={{ fontFamily: token.fontDisplay, fontSize: 20, fontWeight: 700, color: token.textPrimary, marginBottom: 8 }}>
            No matches found
          </div>
          <p style={{ color: token.textSecondary, fontSize: 14 }}>
            {reviewed.length === 0
              ? 'No reviewed matches yet. Start reviewing in the Review page.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {matches.map(match => {
          const st      = getStatus(match.status);
          const expanded = expandedRows.has(match.id);

          return (
            <div
              key={match.id}
              className="mm-card"
              style={{
                background: token.surface,
                borderRadius: token.radius,
                boxShadow: token.shadow,
                border: `1px solid ${token.border}`,
                overflow: 'hidden',
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
              }}
            >
              {/* ── Row header ── */}
              <div style={{ padding: '18px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>

                  {/* Expand toggle */}
                  <button
                    onClick={() => toggleRow(match.id)}
                    style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      border: `1.5px solid ${token.border}`, background: '#f8fafc',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', marginTop: 2, transition: 'all 0.15s ease',
                      color: token.textMuted,
                    }}
                  >
                    {expanded
                      ? <ChevronDown size={15} />
                      : <ChevronRight size={15} />}
                  </button>

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Top row: name + status + confidence */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: token.fontDisplay, fontSize: 16, fontWeight: 700,
                        color: token.textPrimary, letterSpacing: '-0.2px',
                      }}>
                        {match.finalRecord.fields.name || match.id || 'Unknown'}
                      </span>

                      {/* Status pill */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: st.bg, color: st.color,
                        fontSize: 11, fontWeight: 700, padding: '3px 10px',
                        borderRadius: 99, letterSpacing: '0.04em',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: 99, background: st.dot, flexShrink: 0 }} />
                        {st.label}
                      </span>

                      {/* Confidence bar */}
                      <ConfBar value={match.confidence || 0} />
                    </div>

                    {/* Final record pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
                        fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}>
                        Final Record
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: token.textPrimary }}>
                        {match.finalRecord.fields.name || 'Unknown'}
                      </span>
                      {match.finalRecord.fields.registry_code && (
                        <span style={{ fontSize: 12, color: token.textMuted }}>
                          #{match.finalRecord.fields.registry_code}
                        </span>
                      )}
                    </div>

                    {/* Meta row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12, color: token.textMuted }}>
                      {match.finalRecord.fields.vat && (
                        <>
                          <span style={{ fontWeight: 600, color: token.textSecondary }}>VAT</span>
                          <span>{match.finalRecord.fields.vat}</span>
                          <span>·</span>
                        </>
                      )}
                      {match.finalRecord.fields.country && (
                        <>
                          <span>{match.finalRecord.fields.country}</span>
                          <span>·</span>
                        </>
                      )}

                      {/* Reviewer + timestamp with tooltip */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span style={{
                              cursor: 'help', textDecoration: 'underline',
                              textDecorationStyle: 'dotted', textDecorationColor: token.textMuted,
                            }}>
                              {match.reviewer || 'Unknown'} · {formatDateTime(match.reviewedAt)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent style={{ fontFamily: token.fontBody }}>
                            <div style={{ fontSize: 13 }}>
                              <p style={{ marginBottom: 4 }}><strong>Audit Trail</strong></p>
                              <p>
                                {match.reviewer}{' '}
                                {match.status === 'rejected' ? 'rejected'
                                  : match.status === 'confirmed' ? 'confirmed'
                                  : 'marked as needs review'}{' '}
                                this match
                              </p>
                              <p style={{ color: token.textMuted }}>at {formatDateTime(match.reviewedAt)}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {/* Undo button */}
                  <button
                    onClick={() => { undo(match.id); toast.success(`Undo applied to ${match.id}`); }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: token.radiusSm, fontSize: 12,
                      fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                      border: `1.5px solid ${token.border}`, background: token.surface,
                      color: token.textSecondary, fontFamily: token.fontBody,
                      transition: 'all 0.15s ease',
                    }}
                    className="mm-undo"
                  >
                    <Undo2 size={13} /> Undo
                  </button>
                </div>
              </div>

              {/* ── Expanded record details ── */}
              {expanded && (
                <div style={{
                  borderTop: `1px solid ${token.border}`,
                  background: '#f8fafc',
                  padding: '20px 24px',
                  animation: 'fadeIn 0.2s ease',
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: token.textMuted, marginBottom: 14,
                  }}>
                    Record Details — All Sources
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min((match.records || []).length, 5)}, 1fr)`,
                    gap: 12,
                  }}>
                    {(match.records || []).map((record, idx) => {
                      const isRegistry  = record.source === 'registry';
                      const sourceName  = isRegistry ? 'Registry' : record.source.toUpperCase();
                      return (
                        <div
                          key={idx}
                          style={{
                            background: token.surface,
                            borderRadius: token.radiusSm,
                            boxShadow: isRegistry ? token.shadowRing : token.shadow,
                            border: `1px solid ${isRegistry ? token.indigo : token.border}`,
                            overflow: 'hidden',
                          }}
                        >
                          {/* Source header */}
                          <div style={{
                            padding: '10px 14px',
                            background: isRegistry
                              ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                              : 'linear-gradient(135deg,#f8fafc,#f1f5f9)',
                            borderBottom: `1px solid ${isRegistry ? 'transparent' : token.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          }}>
                            <span style={{
                              fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              color: isRegistry ? '#fff' : token.textSecondary,
                            }}>
                              {sourceName}
                            </span>
                            {isRegistry && (
                              <span style={{
                                background: 'rgba(255,255,255,0.22)', color: '#fff',
                                fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                                padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase',
                              }}>
                                Primary
                              </span>
                            )}
                          </div>

                          {/* Fields */}
                          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                              ['Name',    record.fields.name],
                              ['VAT',     record.fields.vat],
                              ...(record.fields.registry_code ? [['Registry Code', record.fields.registry_code]] : []),
                              ['Address', record.fields.address],
                              ...(record.fields.phone  ? [['Phone', record.fields.phone]]  : []),
                              ...(record.fields.email  ? [['Email', record.fields.email]]  : []),
                            ].map(([label, val]) => (
                              <div key={String(label)}>
                                <div style={{
                                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                                  letterSpacing: '0.06em', color: token.textMuted, marginBottom: 2,
                                }}>
                                  {label}
                                </div>
                                <div style={{
                                  fontSize: 12, color: val ? token.textPrimary : token.textMuted,
                                  fontStyle: val ? 'normal' : 'italic', wordBreak: 'break-word',
                                  fontWeight: label === 'Registry Code' ? 700 : 400,
                                }}>
                                  {val || '(not provided)'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── Tabs ──
  const tabs = [
    { key: 'all',          label: 'All Matches',  dot: null         },
    { key: 'confirmed',    label: 'Accepted',     dot: token.green  },
    { key: 'rejected',     label: 'Rejected',     dot: token.red    },
    { key: 'needs_review', label: 'Needs Review', dot: token.amber  },
  ];

  const anyFilterActive = confidenceFilter || dateFilter;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeIn  { from { opacity:0;transform:translateY(6px) } to { opacity:1;transform:translateY(0) } }
        .mm-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.1) !important; transform: translateY(-1px); }
        .mm-undo:hover { background: #f0f4ff !important; border-color: ${token.indigoMid} !important; color: ${token.indigo} !important; }
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
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: token.fontDisplay, fontSize: 26, fontWeight: 700, color: token.textPrimary, letterSpacing: '-0.5px', marginBottom: 6 }}>
              Match Management
            </div>
            <p style={{ fontSize: 14, color: token.textSecondary }}>
              View, search, and manage all reviewed entity matches
            </p>
          </div>

          {/* ── Search + filter card ── */}
          <div style={{
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
            borderRadius: token.radius, boxShadow: token.shadow,
            border: `1px solid ${token.border}`, padding: '20px 24px', marginBottom: 20,
          }}>
            {/* Search row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search
                  size={16}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: token.textMuted, pointerEvents: 'none' }}
                />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by company name, VAT, registry code, country, reviewer…"
                  style={{
                    width: '100%', padding: '9px 12px 9px 38px',
                    borderRadius: token.radiusSm, border: `1.5px solid ${token.border}`,
                    fontSize: 14, fontFamily: token.fontBody, color: token.textPrimary,
                    background: token.surface, outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={e => (e.target.style.borderColor = token.indigo)}
                  onBlur={e  => (e.target.style.borderColor = token.border)}
                />
              </div>
              {anyFilterActive && (
                <button
                  onClick={() => { setConfidenceFilter(null); setDateFilter(null); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '8px 14px', borderRadius: token.radiusSm, fontSize: 13,
                    fontWeight: 600, cursor: 'pointer', background: token.redLight,
                    color: '#991b1b', border: `1.5px solid #fca5a5`,
                    fontFamily: token.fontBody,
                  }}
                >
                  <X size={12} /> Clear filters
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: token.textMuted, marginRight: 4 }}>
                Filter
              </span>
              <PillBtn active={confidenceFilter === 'high'} onClick={() => setConfidenceFilter(confidenceFilter === 'high' ? null : 'high')}>
                High Confidence (&gt;90%)
              </PillBtn>
              <PillBtn active={confidenceFilter === 'low'} onClick={() => setConfidenceFilter(confidenceFilter === 'low' ? null : 'low')}>
                Low Confidence (&lt;80%)
              </PillBtn>
              <PillBtn active={dateFilter === 'week'} onClick={() => setDateFilter(dateFilter === 'week' ? null : 'week')}>
                This Week
              </PillBtn>
              <PillBtn active={dateFilter === 'month'} onClick={() => setDateFilter(dateFilter === 'month' ? null : 'month')}>
                Last 30 Days
              </PillBtn>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)',
            borderRadius: token.radiusSm, padding: 4,
            border: `1px solid ${token.border}`, boxShadow: token.shadow,
            marginBottom: 20, width: 'fit-content',
          }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={tabStyle(activeTab === tab.key)}
              >
                {tab.dot && (
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: tab.dot, flexShrink: 0 }} />
                )}
                {tab.label}
                <span style={{
                  marginLeft: 2,
                  padding: '1px 7px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                  background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : token.border,
                  color: activeTab === tab.key ? '#fff' : token.textMuted,
                }}>
                  {counts[tab.key as keyof typeof counts]}
                </span>
              </button>
            ))}
          </div>

          {/* ── Match list ── */}
          {renderMatchList(filteredMatches)}

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          PICK FROM REGISTRY DIALOG (original logic, restyled)
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={pickRegistryDialogOpen} onOpenChange={setPickRegistryDialogOpen}>
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
              Pick from Registry
            </div>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
            <p style={{ fontSize: 14, color: token.textSecondary, lineHeight: 1.7, marginBottom: 12 }}>
              In a full implementation, this would open a registry search interface to select the final record for this entity group.
            </p>
            <p style={{ fontSize: 13, color: token.textSecondary, marginBottom: 10 }}>
              This is a prototype limitation. Registry selection would typically:
            </p>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                'Search official business registries',
                'Match by VAT number, registry code, or company name',
                'Display registry records with verified information',
                'Allow selection of the final "source of truth" record',
              ].map((item, i) => (
                <li key={i} style={{ fontSize: 13, color: token.textSecondary, lineHeight: 1.5 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Sticky footer */}
          <div style={{
            padding: '16px 28px 24px', borderTop: `1px solid ${token.border}`,
            flexShrink: 0, background: token.surface,
            borderRadius: `0 0 ${token.radius}px ${token.radius}px`,
            display: 'flex', justifyContent: 'flex-end',
          }}>
            <button
              onClick={() => setPickRegistryDialogOpen(false)}
              style={{
                padding: '9px 22px', borderRadius: token.radiusSm, fontSize: 14,
                fontWeight: 600, cursor: 'pointer', background: '#f8fafc',
                color: token.textSecondary, border: `1.5px solid ${token.border}`,
                fontFamily: token.fontBody, transition: 'all 0.15s ease',
              }}
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}