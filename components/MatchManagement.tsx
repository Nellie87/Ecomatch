import React, { useState, useMemo } from 'react';
import { Search, Filter, Undo2, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { type MatchPair } from '../mockData';
import { useMatches } from '../contexts/MatchContext';

export function MatchManagement() {
  const { reviewedMatches, undoReview } = useMatches();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState<'high' | 'low' | null>(null);
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | null>(null);

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

  // Filter matches based on search, status, confidence, and date
  const filteredMatches = useMemo(() => {
    let matches: MatchPair[] = [...reviewedMatches];

    // Filter by status tab
    if (activeTab !== 'all') {
      matches = matches.filter(match => match.status === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      matches = matches.filter(match => {
        const nameMatch = match.records.some(r => r.name.toLowerCase().includes(query));
        const vatMatch = match.records.some(r => r.vat.toLowerCase().includes(query));
        const reviewerMatch = match.reviewer?.toLowerCase().includes(query) || false;
        return nameMatch || vatMatch || reviewerMatch;
      });
    }

    // Filter by confidence
    if (confidenceFilter === 'high') {
      matches = matches.filter(match => match.confidence > 0.9);
    } else if (confidenceFilter === 'low') {
      matches = matches.filter(match => match.confidence < 0.8);
    }

    // Filter by date
    if (dateFilter) {
      const now = new Date();
      const filterDate = new Date();
      if (dateFilter === 'week') {
        filterDate.setDate(now.getDate() - 7);
      } else if (dateFilter === 'month') {
        filterDate.setDate(now.getDate() - 30);
      }
      matches = matches.filter(match => {
        if (!match.reviewedAt) return false;
        const reviewedDate = new Date(match.reviewedAt);
        return reviewedDate >= filterDate;
      });
    }

    return matches;
  }, [activeTab, searchQuery, confidenceFilter, dateFilter]);

  const renderMatchList = (matches: MatchPair[]) => {
    if (matches.length === 0) {
      return (
        <Card className="p-12 text-center backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20">
          <div className="text-gray-400 text-5xl mb-4">🔍</div>
          <h3 className="text-gray-900 dark:text-white mb-2">No matches found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria
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
                        {match.records[0].name}
                      </h3>
                      <Badge className={`${getStatusColor(match.status)} text-white`}>
                        {match.status === 'confirmed' ? 'Confirmed' : match.status === 'rejected' ? 'Rejected' : 'Needs Review'}
                      </Badge>
                      <Badge variant="outline">
                        Confidence: {Math.round(match.confidence * 100)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>VAT: {match.records[0].vat}</span>
                      <span>•</span>
                      <span>{match.records[0].country}</span>
                      <span>•</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {match.reviewer} • {match.reviewedAt && formatDateTime(match.reviewedAt)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <p className="mb-1">
                                <strong>Audit Trail:</strong>
                              </p>
                              <p>
                                {match.reviewer} {match.status === 'rejected' ? 'rejected' : 'confirmed'} this match
                              </p>
                              <p>at {match.reviewedAt && formatDateTime(match.reviewedAt)}</p>
                              {match.rejectionReason && (
                                <p className="mt-1 text-red-400">
                                  Reason: {match.rejectionReason}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {match.rejectionReason && (
                      <div className="mt-2">
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Reason: {match.rejectionReason}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => undoReview(match.id)}
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
                  {match.records.map((record, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                    >
                      <Badge className="mb-3 bg-blue-500 text-white">{record.source}</Badge>
                      <div className="space-y-2 text-sm">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Name</div>
                          <div className="text-gray-900 dark:text-white">{record.name}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">VAT</div>
                          <div className="text-gray-900 dark:text-white">{record.vat}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Address</div>
                          <div className="text-gray-900 dark:text-white">{record.address}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Phone</div>
                          <div className="text-gray-900 dark:text-white">{record.phone}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Email</div>
                          <div className="text-gray-900 dark:text-white break-all">{record.email}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <h5 className="text-sm text-gray-900 dark:text-white mb-2">AI Explanation</h5>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Name Similarity</div>
                      <div className="text-gray-900 dark:text-white">
                        {Math.round(match.aiExplanation.nameSimilarity * 100)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">VAT Match</div>
                      <div className="text-gray-900 dark:text-white">
                        {match.aiExplanation.vatMatch ? '✓ Exact' : '✗ No Match'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Address Similarity</div>
                      <div className="text-gray-900 dark:text-white">
                        {Math.round(match.aiExplanation.addressSimilarity * 100)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Overall Score</div>
                      <div className="text-gray-900 dark:text-white">
                        {Math.round(match.aiExplanation.overallScore * 100)}%
                      </div>
                    </div>
                  </div>
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
                placeholder="Search by company name, VAT, reviewer..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
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
    </div>
  );
}
