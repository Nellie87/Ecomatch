import React from 'react';
import { X, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { type MatchPair } from '../mockData';

interface ExplainableAIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: MatchPair;
}

export function ExplainableAIPanel({ isOpen, onClose, matchData }: ExplainableAIPanelProps) {
  if (!isOpen) return null;

  const { aiExplanation } = matchData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md h-full bg-white dark:bg-gray-900 shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white">AI Match Explanation</h2>
                <p className="text-sm text-white/80">Why we suggested this match</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Overall Score */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
              <div className="text-center">
                <div className="text-4xl mb-2 text-blue-600 dark:text-blue-400">
                  {Math.round(aiExplanation.overallScore * 100)}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Overall Match Score</p>
              </div>
            </Card>

            {/* Similarity Breakdown */}
            <div className="space-y-4">
              <h3 className="text-gray-900 dark:text-white">Similarity Breakdown</h3>

              {/* Name Similarity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Name Similarity</span>
                  <Badge className={aiExplanation.nameSimilarity >= 0.8 ? 'bg-green-500' : 'bg-yellow-500'}>
                    {Math.round(aiExplanation.nameSimilarity * 100)}%
                  </Badge>
                </div>
                <Progress value={aiExplanation.nameSimilarity * 100} className="h-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Based on Levenshtein distance and token matching
                </p>
              </div>

              {/* VAT Match */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">VAT Match</span>
                  {aiExplanation.vatMatch ? (
                    <Badge className="bg-green-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Exact Match
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      No Match
                    </Badge>
                  )}
                </div>
                <Progress value={aiExplanation.vatMatch ? 100 : 0} className="h-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {aiExplanation.vatMatch ? 'All records share the same VAT number' : 'VAT numbers differ across sources'}
                </p>
              </div>

              {/* Address Similarity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Address Similarity</span>
                  <Badge className={aiExplanation.addressSimilarity >= 0.8 ? 'bg-green-500' : 'bg-yellow-500'}>
                    {Math.round(aiExplanation.addressSimilarity * 100)}%
                  </Badge>
                </div>
                <Progress value={aiExplanation.addressSimilarity * 100} className="h-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Normalized address comparison with abbreviation handling
                </p>
              </div>

              {/* Phone Similarity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Phone Similarity</span>
                  <Badge className={aiExplanation.phoneSimilarity >= 0.8 ? 'bg-green-500' : 'bg-yellow-500'}>
                    {Math.round(aiExplanation.phoneSimilarity * 100)}%
                  </Badge>
                </div>
                <Progress value={aiExplanation.phoneSimilarity * 100} className="h-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Phone numbers normalized and compared
                </p>
              </div>
            </div>

            {/* Matched Fields */}
            <div>
              <h3 className="text-gray-900 dark:text-white mb-3">Key Matched Fields</h3>
              <div className="space-y-2">
                <Card className="p-3 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 dark:text-white">VAT Number</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Exact match across all sources</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-3 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 dark:text-white">Company Name</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Acronym expansions: Ltd = Limited
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-3 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 dark:text-white">Phone Number</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Same number with different formatting
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Model Info */}
            <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
              <h4 className="text-sm text-gray-900 dark:text-white mb-2">Model Information</h4>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <p>Algorithm: Gradient Boosted Decision Trees</p>
                <p>Trained on: 150,000+ validated matches</p>
                <p>Last updated: November 1, 2025</p>
                <p>Confidence threshold: 75%</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
