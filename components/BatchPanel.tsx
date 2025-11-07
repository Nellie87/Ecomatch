import { useState } from "react";
import { useReviewStore } from "../src/state/reviewStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { toast } from "./ui/sonner";

export function BatchPanel() {
  const store = useReviewStore();
  const { all, selection, toggleSelect, clearSelection, setStatus, filter, confirm, reject, merge, split } = store;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [mergeSuccessOpen, setMergeSuccessOpen] = useState(false);

  // Filter to only show rejected and needs_review items
  const batchItems = (all || []).filter(it => it.status === 'rejected' || it.status === 'needs_review');
  const selectedArray = Array.from(selection || []).filter(id => batchItems.some(item => item.id === id));
  const disabled = selectedArray.length === 0;

  const run = (kind: "confirm" | "reject" | "merge" | "split") => {
    const ids = selectedArray;
    if (ids.length === 0) return;

    if (kind === "confirm") {
      confirm(ids);
      toast.success(`Batch confirm processed for ${ids.length} item(s).`);
    } else if (kind === "reject") {
      reject(ids);
      toast.success(`Batch reject processed for ${ids.length} item(s).`);
    } else if (kind === "merge") {
      merge(ids);
      setMergeSuccessOpen(true);
      toast.success(`Batch merge processed for ${ids.length} item(s).`);
    } else if (kind === "split") {
      split(ids);
      toast.success(`Batch split processed for ${ids.length} item(s).`);
    }

    clearSelection();
    setConfirmOpen(false);
    setRejectOpen(false);
    setMergeOpen(false);
    setSplitOpen(false);
  };

  return (
    <Card className="mb-6 p-4 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">Batch Operations</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">(Rejected & Needs Review only)</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Selected: <b className="text-gray-900 dark:text-white">{selectedArray.length}</b>
        </div>
      </div>
      <div className="max-h-64 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {batchItems.map(it => {
          const sources = (it.records || []).map(r => r.source || (r as any).source).join(", ");
          return (
            <label
              key={it.id}
              className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-3 py-2 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={selection?.has(it.id) || false}
                  onChange={(e) => toggleSelect(it.id)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {it.records?.[0]?.fields?.name || it.records?.[0]?.name || it.id}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Status: {it.status} • Confidence: {(it.confidence * 100).toFixed(0)}% • Sources: {sources}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{it.id}</div>
            </label>
          );
        })}
        {batchItems.length === 0 && (
          <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">No items in Rejected or Needs Review status.</div>
        )}
      </div>
      {/* Batch actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          disabled={disabled}
          onClick={() => setConfirmOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batch Confirm
        </Button>
        <Button
          disabled={disabled}
          onClick={() => setRejectOpen(true)}
          variant="outline"
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batch Reject
        </Button>
        <Button
          disabled={disabled}
          onClick={() => setMergeOpen(true)}
          variant="outline"
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batch Merge
        </Button>
        <Button
          disabled={disabled}
          onClick={() => setSplitOpen(true)}
          variant="outline"
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batch Split
        </Button>
        <Button
          onClick={clearSelection}
          variant="outline"
          className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Clear
        </Button>
      </div>

      {/* Confirmation modals */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
          <DialogHeader>
            <DialogTitle>Confirm selected</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to <b>Confirm</b> {selectedArray.length} selected item(s)?
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setConfirmOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={() => run("confirm")} className="bg-green-500 hover:bg-green-600 text-white">
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
          <DialogHeader>
            <DialogTitle>Reject selected</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 dark:text-gray-300">
            Reject {selectedArray.length} selected item(s)? This sets status to <b>Rejected</b>.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setRejectOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={() => run("reject")} className="bg-red-600 hover:bg-red-700 text-white">
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
          <DialogHeader>
            <DialogTitle>Merge selected (UI-only)</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 dark:text-gray-300">
            Merging will mark these {selectedArray.length} group(s) as <b>Confirmed</b> and log a merge note (UI simulation).
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setMergeOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={() => run("merge")} className="bg-blue-600 hover:bg-blue-700 text-white">
              Merge
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Merge Success Modal */}
      <Dialog open={mergeSuccessOpen} onOpenChange={setMergeSuccessOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-gray-900 dark:text-white mb-2 text-lg font-semibold">Batch Merge Successful</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedArray.length} group(s) were merged successfully and marked as <b>Confirmed</b>.
            </p>
            <Button
              onClick={() => {
                setMergeSuccessOpen(false);
                clearSelection();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Exit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={splitOpen} onOpenChange={setSplitOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
          <DialogHeader>
            <DialogTitle>Split selected (UI-only)</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 dark:text-gray-300">
            Split will route these groups to <b>Needs Review</b> for manual handling.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setSplitOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={() => run("split")}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Split
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

