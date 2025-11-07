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

export function ReviewerScreen() {
  const { candidates, confirm, reject, needsReview, merge, split } = useMatches();
  
  // Filter to only suggested candidates
  const suggestedCandidates = useMemo(() => 
    candidates.filter(c => c.status === 'suggested'),
    [candidates]
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

  const totalRecords = candidates.length;
  const reviewedCount = candidates.filter(c => c.status !== 'suggested').length;
  const progress = totalRecords > 0 ? (reviewedCount / totalRecords) * 100 : 0;
  const currentGroup = suggestedCandidates.length > 0 ? (suggestedCandidates[currentIndex] || suggestedCandidates[0]) : null;
  
  // Mock reviewer name - in a real app this would come from auth
  const reviewerName = 'Current User';

  const handleNext = useCallback(() => {
    if (suggestedCandidates.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % suggestedCandidates.length);
    }
  }, [suggestedCandidates.length]);

  const handleConfirm = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  const executeConfirm = useCallback(() => {
    if (!currentGroup) return;
    
    confirm(currentGroup.id);
    setShowConfirmModal(false);
    toast.success(`Group ${currentGroup.id} confirmed successfully.`);
    handleNext();
  }, [currentGroup, confirm, handleNext]);

  const handleReject = useCallback(() => {
    setShowRejectionDialog(true);
  }, []);

  const handleMerge = useCallback(() => {
    setShowMergeConfirmModal(true);
  }, []);

  const executeMerge = useCallback(() => {
    if (!currentGroup) return;
    
    merge(currentGroup.id);
    setShowMergeConfirmModal(false);
    setShowMergeSuccessModal(true);
    toast.success(`Group ${currentGroup.id} merged successfully.`);
  }, [currentGroup, merge]);

  const handleSplit = useCallback(() => {
    setShowSplitModal(true);
  }, []);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't trigger if dialogs are open
      if (showRejectionDialog || showSuccessDialog || showConfirmModal || showMergeConfirmModal || showMergeSuccessModal || showSplitModal) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'c':
          e.preventDefault();
          handleConfirm();
          break;
        case 'x':
          e.preventDefault();
          handleReject();
          break;
        case 'm':
          e.preventDefault();
          handleMerge();
          break;
        case 'd':
          e.preventDefault();
          handleSplit();
          break;
        case 'n':
          e.preventDefault();
          handleNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showRejectionDialog, showSuccessDialog, showConfirmModal, showMergeConfirmModal, showMergeSuccessModal, showSplitModal, handleConfirm, handleReject, handleMerge, handleSplit, handleNext]);

  const getFieldStatus = (field: string, records: SourceRecord[]) => {
    const values = records.map(r => r.fields[field as keyof typeof r.fields] || '');
    const normalized = values.map(v => String(v).toLowerCase().replace(/[^a-z0-9]/g, ''));
    const allSame = normalized.length > 0 && normalized.every(v => v === normalized[0] && v !== '');
    return allSame ? 'match' : 'partial';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 pt-24 pb-12 px-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Progress Bar */}
        <Card className="mb-6 p-6 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-gray-900 dark:text-white">Review Progress</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {reviewedCount} of {totalRecords} reviewed — {Math.round(progress)}% complete
              </p>
            </div>
            {currentGroup && (
              <Badge className="bg-blue-500 text-white px-4 py-2">
                Confidence: {Math.round((currentGroup.confidence || 0) * 100)}%
              </Badge>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </Card>

        {/* Batch Panel */}
        <BatchPanel />

        {/* Main Comparison View */}
        {!currentGroup ? (
          <Card className="p-12 text-center backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl">
            <div className="text-gray-400 text-5xl mb-4">✓</div>
            <h3 className="text-gray-900 dark:text-white mb-2">
              {suggestedCandidates.length === 0 && candidates.length === 0 
                ? 'No candidates available' 
                : 'All matches reviewed!'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {suggestedCandidates.length === 0 && candidates.length === 0
                ? 'Start by loading mock data in the Admin page.'
                : "You've completed reviewing all pending matches."}
            </p>
          </Card>
        ) : (
        <div className="grid grid-cols-5 gap-4 mb-6">
          {currentGroup.records.map((record, idx) => {
            const isRegistry = record.source === 'registry';
            const sourceName = record.source.charAt(0).toUpperCase() + record.source.slice(1);
            return (
              <Card
                key={idx}
                className={`p-5 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
                  isRegistry ? 'ring-2 ring-sky-400/60 ring-offset-2 shadow-lg' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    {sourceName}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div
                    onMouseEnter={() => setHoveredField('name')}
                    onMouseLeave={() => setHoveredField(null)}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      hoveredField === 'name'
                        ? 'bg-blue-100/80 dark:bg-blue-900/30 ring-2 ring-blue-500 scale-105'
                        : 'bg-gray-50 dark:bg-gray-800/50'
                    }`}
                  >
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Company Name</div>
                    <div className="text-sm text-gray-900 dark:text-white break-words">
                      {record.fields.name || '(not provided)'}
                    </div>
                    {getFieldStatus('name', currentGroup.records) === 'match' && (
                      <Badge className="mt-2 bg-green-500 text-white text-xs">✓ Match</Badge>
                    )}
                  </div>

                  <div
                    onMouseEnter={() => setHoveredField('vat')}
                    onMouseLeave={() => setHoveredField(null)}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      hoveredField === 'vat'
                        ? 'bg-blue-100/80 dark:bg-blue-900/30 ring-2 ring-blue-500 scale-105'
                        : 'bg-gray-50 dark:bg-gray-800/50'
                    }`}
                  >
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">VAT</div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {record.fields.vat || '(not provided)'}
                    </div>
                    {getFieldStatus('vat', currentGroup.records) === 'match' && (
                      <Badge className="mt-2 bg-green-500 text-white text-xs">✓ Match</Badge>
                    )}
                  </div>

                  <div
                    onMouseEnter={() => setHoveredField('address')}
                    onMouseLeave={() => setHoveredField(null)}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      hoveredField === 'address'
                        ? 'bg-blue-100/80 dark:bg-blue-900/30 ring-2 ring-blue-500 scale-105'
                        : 'bg-gray-50 dark:bg-gray-800/50'
                    }`}
                  >
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Address</div>
                    <div className="text-sm text-gray-900 dark:text-white break-words">
                      {record.fields.address || '(not provided)'}
                    </div>
                  </div>

                  <div
                    onMouseEnter={() => setHoveredField('country')}
                    onMouseLeave={() => setHoveredField(null)}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      hoveredField === 'country'
                        ? 'bg-blue-100/80 dark:bg-blue-900/30 ring-2 ring-blue-500 scale-105'
                        : 'bg-gray-50 dark:bg-gray-800/50'
                    }`}
                  >
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Country</div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {record.fields.country || '(not provided)'}
                    </div>
                    {getFieldStatus('country', currentGroup.records) === 'match' && (
                      <Badge className="mt-2 bg-green-500 text-white text-xs">✓ Match</Badge>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {record.fields.phone || '(not provided)'}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</div>
                    <div className="text-sm text-gray-900 dark:text-white break-words">
                      {record.fields.email || '(not provided)'}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        )}

        {/* Action Buttons */}
        {currentGroup && (
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setShowExplainableAI(true)}
            variant="outline"
            className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
          >
            <Info className="w-4 h-4 mr-2" />
            Why this match?
          </Button>

          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 px-8"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm
            </Button>

            <Button
              onClick={handleReject}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/30 px-8"
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>

            <Button
              onClick={handleMerge}
              variant="outline"
              className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              <Merge className="w-4 h-4 mr-2" />
              Merge
            </Button>

            <Button
              onClick={handleSplit}
              variant="outline"
              className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30"
            >
              <Scissors className="w-4 h-4 mr-2" />
              Split
            </Button>

            <Button
              onClick={handleNext}
              variant="outline"
              className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip
            </Button>
          </div>
        </div>
        )}

        {/* Keyboard Shortcuts Bar */}
        <Card className="mt-6 p-4 backdrop-blur-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-200/50 dark:border-blue-800/50">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-white dark:bg-gray-800 border shadow-sm">C</kbd>
              <span className="text-gray-700 dark:text-gray-300">Confirm</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-white dark:bg-gray-800 border shadow-sm">X</kbd>
              <span className="text-gray-700 dark:text-gray-300">Reject</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-white dark:bg-gray-800 border shadow-sm">M</kbd>
              <span className="text-gray-700 dark:text-gray-300">Merge</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-white dark:bg-gray-800 border shadow-sm">D</kbd>
              <span className="text-gray-700 dark:text-gray-300">Split</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-white dark:bg-gray-800 border shadow-sm">N</kbd>
              <span className="text-gray-700 dark:text-gray-300">Next</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
          <DialogHeader>
            <DialogTitle>Reject Match</DialogTitle>
          </DialogHeader>
          {currentGroup && currentGroup.reasons && currentGroup.reasons.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">Key Issues:</div>
              <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 list-disc pl-5">
                {currentGroup.reasons.filter(r => r.score < 0 || r.strength === 'weak').slice(0, 3).map((reason, idx) => (
                  <li key={idx}>{reason.text}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Select Rejection Reason</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="space-y-3">
              {rejectionReasons.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label htmlFor={reason} className="cursor-pointer">
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={submitRejection}
              disabled={!selectedReason}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              Submit Rejection
            </Button>
            <Button
              onClick={() => setShowRejectionDialog(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-gray-900 dark:text-white mb-2">Match Confirmed!</h3>
            <p className="text-gray-600 dark:text-gray-400">You improved model precision by +0.2% today</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
          <DialogHeader>
            <DialogTitle>Confirm Match</DialogTitle>
          </DialogHeader>
          {currentGroup && (
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to <b>Confirm</b> this match?
              </p>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <div><b>Group ID:</b> {currentGroup.id}</div>
                <div><b>Confidence:</b> {(currentGroup.confidence * 100).toFixed(0)}%</div>
                <div><b>Sources:</b> {currentGroup.records.map(r => r.source).join(", ")}</div>
                {currentGroup.reasons && currentGroup.reasons.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="font-semibold mb-2">Top Match Reasons:</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {currentGroup.reasons.slice(0, 5).map((reason, idx) => (
                        <li key={idx}>{reason.text} ({reason.strength})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setShowConfirmModal(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={executeConfirm} className="bg-green-500 hover:bg-green-600 text-white">
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Merge Confirmation Modal */}
      <Dialog open={showMergeConfirmModal} onOpenChange={setShowMergeConfirmModal}>
        <DialogContent className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
          <DialogHeader>
            <DialogTitle>Merge Match</DialogTitle>
          </DialogHeader>
          {currentGroup && (
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                These records will be merged into one entity. Are you sure you want to <b>Merge</b> this match?
              </p>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <div><b>Group ID:</b> {currentGroup.id}</div>
                <div><b>Confidence:</b> {(currentGroup.confidence * 100).toFixed(0)}%</div>
                <div><b>Sources to merge:</b> {currentGroup.records.map(r => r.source).join(", ")}</div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Merging will create a unified entity and mark this match as Confirmed.
                </div>
              </div>
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setShowMergeConfirmModal(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={executeMerge} className="bg-blue-600 hover:bg-blue-700 text-white">
              Merge
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Merge Success Modal */}
      <Dialog open={showMergeSuccessModal} onOpenChange={setShowMergeSuccessModal}>
        <DialogContent className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Merge className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-gray-900 dark:text-white mb-2 text-lg font-semibold">Merge Successful</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The records were merged successfully and marked as <b>Confirmed</b>.
            </p>
            <Button
              onClick={() => {
                setShowMergeSuccessModal(false);
                handleNext();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Exit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Split Modal */}
      <Dialog open={showSplitModal} onOpenChange={(open) => {
        setShowSplitModal(open);
        if (!open) setSelectedRecordsToSplit(new Set());
      }}>
        <DialogContent className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Split Match</DialogTitle>
          </DialogHeader>
          {currentGroup && (
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Select which records to split out into separate entities:
              </p>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                <div><b>Group ID:</b> {currentGroup.id}</div>
                <div><b>Confidence:</b> {(currentGroup.confidence * 100).toFixed(0)}%</div>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-64 overflow-auto">
                {currentGroup.records.map((record, idx) => {
                  const recordId = `${record.source}-${idx}`;
                  return (
                    <label
                      key={idx}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecordsToSplit.has(recordId)}
                        onChange={(e) => {
                          const newSet = new Set(selectedRecordsToSplit);
                          if (e.target.checked) {
                            newSet.add(recordId);
                          } else {
                            newSet.delete(recordId);
                          }
                          setSelectedRecordsToSplit(newSet);
                        }}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{record.source}: {record.fields.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{record.fields.vat || 'N/A'} • {record.fields.country || 'N/A'}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => {
              setShowSplitModal(false);
              setSelectedRecordsToSplit(new Set());
            }} variant="outline">
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
              className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
            >
              Split Selected ({selectedRecordsToSplit.size})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Explainable AI Panel */}
      <ExplainableAIPanel
        isOpen={showExplainableAI}
        onClose={() => setShowExplainableAI(false)}
        matchData={currentGroup}
      />
    </div>
  );
}
