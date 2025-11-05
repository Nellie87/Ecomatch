import { useState } from "react";
import { useReviewStore } from "../store/reviewStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { toast } from "sonner";

export function BatchPanel() {
  const { items, selected, select, clearSelection, filter, setFilter, actOn } = useReviewStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);

  const filtered = items.filter(it => filter === "all" ? true : it.status === filter);
  const selectedArray = Array.from(selected);
  const disabled = selectedArray.length === 0;

  const run = (kind: "confirm" | "reject" | "merge" | "split") => {
    actOn(selectedArray, kind);
    clearSelection();
    setConfirmOpen(false);
    setRejectOpen(false);
    setMergeOpen(false);
    setSplitOpen(false);
    toast.success(`Batch ${kind} processed for ${selectedArray.length} item(s).`);
  };

  return (
    <Card className="mb-6 p-4 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
          >
            <option value="all">All</option>
            <option value="rejected">Rejected</option>
            <option value="needs_review">Needs Review</option>
            <option value="suggested">Suggested</option>
            <option value="confirmed">Confirmed</option>
            <option value="conflicted">Conflicted</option>
          </select>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Selected: <b className="text-gray-900 dark:text-white">{selectedArray.length}</b>
        </div>
      </div>
      <div className="max-h-64 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {filtered.map(it => (
          <label
            key={it.id}
            className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-3 py-2 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
          >
            <div className="flex items-center gap-3 flex-1">
              <input
                type="checkbox"
                checked={selected.has(it.id)}
                onChange={(e) => select(it.id, e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{it.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Status: {it.status} • Confidence: {(it.confidence * 100).toFixed(0)}% • Sources: {it.summary?.sources?.join(", ")}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">{it.id}</div>
          </label>
        ))}
        {filtered.length === 0 && (
          <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">No items for this filter.</div>
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
            Merging will mark these groups as <b>Confirmed</b> and log a merge note (UI simulation).
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

