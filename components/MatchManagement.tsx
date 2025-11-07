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

export function MatchManagement() {
  const { reviewed, candidates, filters, setFilters, undo } = useMatches();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState<'high' | 'low' | null>(null);
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | null>(null);
  const [pickRegistryDialogOpen, setPickRegistryDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Get full candidate group data for each reviewed item
  const enrichedReviewed = useMemo(() => {
    return reviewed.map(item => {
      const candidate = candidates.find(c => c.id === item.id);
      return {
        ...item,
        records: candidate?.records || [item.finalRecord],
        band: item.confidence > 0.9 ? 'veryHigh' as const : item.confidence > 0.8 ? 'high' as const : 'other' as const,
      };
    });
  }, [reviewed, candidates]);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'needs_review':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Client-side filtering
  const filteredMatches = useMemo(() => {
    let filtered = [...enrichedReviewed];

    // Status filter (tabs)
    if (activeTab === 'confirmed' || activeTab === 'accepted') {
      filtered = filtered.filter(item => item.status === 'confirmed');
    } else if (activeTab === 'rejected') {
      filtered = filtered.filter(item => item.status === 'rejected');
    } else if (activeTab === 'needs_review') {
      filtered = filtered.filter(item => item.status === 'needs_review');
    }

    // Confidence filter
    if (confidenceFilter === 'high') {
      filtered = filtered.filter(item => item.confidence > 0.9);
    } else if (confidenceFilter === 'low') {
      filtered = filtered.filter(item => item.confidence < 0.8);
    }

    // Date filter
    if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(item => new Date(item.reviewedAt) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      filtered = filtered.filter(item => new Date(item.reviewedAt) >= monthAgo);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const finalFields = item.finalRecord.fields;
        return (
          finalFields.name?.toLowerCase().includes(query) ||
          finalFields.vat?.toLowerCase().includes(query) ||
          finalFields.country?.toLowerCase().includes(query) ||
          item.reviewer?.toLowerCase().includes(query) ||
          item.finalRecord.source.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [enrichedReviewed, activeTab, confidenceFilter, dateFilter, searchQuery]);

  const renderMatchList = (matches: typeof filteredMatches) => {
    if (!matches || matches.length === 0) {
      return (
        <Card className="p-12 text-center backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20">
          <div className="text-gray-400 text-5xl mb-4">🔍</div>
          <h3 className="text-gray-900 dark:text-white mb-2">No matches found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {reviewed.length === 0 
              ? "No reviewed matches available yet. Start reviewing matches in the Review page."
              : "Try adjusting your search or filter criteria"}
          </p>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {matches.map((match) => (
          <Card
            key={match.id}
            className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-lg overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => toggleRow(match.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {expandedRows.has(match.id) ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-gray-900 dark:text-white">
                        {match.finalRecord.fields.name || match.id || 'Unknown'}
                      </h3>
                      <Badge className={`${getStatusColor(match.status)} text-white`}>
                        {match.status === 'confirmed' ? 'Confirmed' : match.status === 'rejected' ? 'Rejected' : 'Needs Review'}
                      </Badge>
                      <Badge variant="outline">
                        Confidence: {Math.round((match.confidence || 0) * 100)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      {/* Final Record Display */}
                      <Badge className="bg-blue-600 text-white">Final record</Badge>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {match.finalRecord.fields.name || 'Unknown'}
                      </span>
                      {match.finalRecord.fields.registry_code && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          #{match.finalRecord.fields.registry_code}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>VAT: {match.finalRecord.fields.vat || 'N/A'}</span>
                      <span>•</span>
                      <span>{match.finalRecord.fields.country || 'N/A'}</span>
                      <span>•</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {match.reviewer || 'Unknown'} • {formatDateTime(match.reviewedAt)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <p className="mb-1">
                                <strong>Audit Trail:</strong>
                              </p>
                              <p>
                                {match.reviewer} {match.status === 'rejected' ? 'rejected' : match.status === 'confirmed' ? 'confirmed' : 'marked as needs review'} this match
                              </p>
                              <p>at {formatDateTime(match.reviewedAt)}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => {
                    undo(match.id);
                    toast.success(`Undo applied to ${match.id}`);
                  }}
                >
                  <Undo2 className="w-4 h-4" />
                  Undo
                </Button>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedRows.has(match.id) && (
              <div className="border-t bg-gray-50 dark:bg-gray-800/50 p-6">
                <h4 className="text-sm text-gray-900 dark:text-white mb-4">
                  Record Details from All Sources
                </h4>
                            <div className="grid grid-cols-5 gap-4">
                              {(match.records || []).map((record, idx) => {
                                const recordSource = record.source === 'registry' ? 'Registry' : record.source.toUpperCase();
                                const isRegistry = record.source === 'registry';
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 ${isRegistry ? 'registry-glow' : ''}`}
                      >
                        <Badge className="mb-3 bg-blue-500 text-white">{recordSource}</Badge>
                        <div className="space-y-2 text-sm">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Name</div>
                            <div className="text-gray-900 dark:text-white">{record.fields.name || '(not provided)'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">VAT</div>
                            <div className="text-gray-900 dark:text-white">{record.fields.vat || '(not provided)'}</div>
                          </div>
                          {record.fields.registry_code && (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Registry Code</div>
                              <div className="text-gray-900 dark:text-white font-semibold">{record.fields.registry_code}</div>
                            </div>
                          )}
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Address</div>
                            <div className="text-gray-900 dark:text-white">{record.fields.address || '(not provided)'}</div>
                          </div>
                          {record.fields.phone && (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Phone</div>
                              <div className="text-gray-900 dark:text-white">{record.fields.phone}</div>
                            </div>
                          )}
                          {record.fields.email && (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Email</div>
                              <div className="text-gray-900 dark:text-white break-all">{record.fields.email}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 pt-24 pb-12 px-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8">
          <h1 className="text-gray-900 dark:text-white mb-2">Match Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View, search, and manage all reviewed entity matches
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 p-6 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by company name, VAT, registry code, country, reviewer..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

          <div className="flex items-center gap-3 mt-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
            {confidenceFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfidenceFilter(null)}
                className="gap-2"
              >
                <X className="w-3 h-3" />
                {confidenceFilter === 'high' ? 'High Confidence' : 'Low Confidence'}
              </Button>
            )}
            {dateFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateFilter(null)}
                className="gap-2"
              >
                <X className="w-3 h-3" />
                {dateFilter === 'week' ? 'This Week' : 'Last 30 Days'}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3 mt-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
            <span>Quick filters:</span>
            <Button 
              variant={confidenceFilter === 'high' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setConfidenceFilter(confidenceFilter === 'high' ? null : 'high')}
            >
              High Confidence ({'>'}90%)
              {confidenceFilter === 'high' && <X className="w-3 h-3 ml-1" />}
            </Button>
            <Button 
              variant={confidenceFilter === 'low' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setConfidenceFilter(confidenceFilter === 'low' ? null : 'low')}
            >
              Low Confidence ({'<'}80%)
              {confidenceFilter === 'low' && <X className="w-3 h-3 ml-1" />}
            </Button>
            <Button 
              variant={dateFilter === 'week' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setDateFilter(dateFilter === 'week' ? null : 'week')}
            >
              This Week
              {dateFilter === 'week' && <X className="w-3 h-3 ml-1" />}
            </Button>
            <Button 
              variant={dateFilter === 'month' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setDateFilter(dateFilter === 'month' ? null : 'month')}
            >
              Last 30 Days
              {dateFilter === 'month' && <X className="w-3 h-3 ml-1" />}
            </Button>
            {(confidenceFilter || dateFilter) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setConfidenceFilter(null);
                  setDateFilter(null);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </Card>

        {/* Tabs for Status */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border shadow-lg">
            <TabsTrigger value="all">All Matches</TabsTrigger>
            <TabsTrigger value="confirmed" className="gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Accepted
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              Rejected
            </TabsTrigger>
            <TabsTrigger value="needs_review" className="gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              Needs Review
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {renderMatchList(filteredMatches)}
          </TabsContent>

          <TabsContent value="confirmed">
            {renderMatchList(filteredMatches)}
          </TabsContent>

          <TabsContent value="rejected">
            {renderMatchList(filteredMatches)}
          </TabsContent>

          <TabsContent value="needs_review">
            {renderMatchList(filteredMatches)}
          </TabsContent>
        </Tabs>
      </div>

      {/* Pick from Registry Dialog */}
      <Dialog open={pickRegistryDialogOpen} onOpenChange={setPickRegistryDialogOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
          <DialogHeader>
            <DialogTitle>Pick from Registry</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-gray-700 dark:text-gray-300">
              In a full implementation, this would open a registry search interface to select the final record for this entity group.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This is a prototype limitation. Registry selection would typically:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Search official business registries</li>
              <li>Match by VAT number, registry code, or company name</li>
              <li>Display registry records with verified information</li>
              <li>Allow selection of the final "source of truth" record</li>
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={() => setPickRegistryDialogOpen(false)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
