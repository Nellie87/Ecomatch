import React from 'react';
import { TrendingUp, Award, Clock, Target } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { performanceMetrics, topRejectionReasons, reviewerLeaderboard } from '../mockData';

export function FeedbackDashboard() {
  const combinedHistory = performanceMetrics.precisionHistory.map((item, idx) => ({
    date: item.date.slice(5),
    Precision: item.value,
    Recall: performanceMetrics.recallHistory[idx].value,
    F1Score: (item.value + performanceMetrics.recallHistory[idx].value) / 2,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 pt-24 pb-12 px-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8">
          <h1 className="text-gray-900 dark:text-white mb-2">Feedback & Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track model performance improvements and reviewer contributions
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card className="p-6 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                <Target className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-green-500 text-white">+5%</Badge>
            </div>
            <div className="text-3xl text-gray-900 dark:text-white mb-1">
              {Math.round(performanceMetrics.precision * 100)}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Precision</p>
          </Card>

          <Card className="p-6 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-green-500 text-white">+7%</Badge>
            </div>
            <div className="text-3xl text-gray-900 dark:text-white mb-1">
              {Math.round(performanceMetrics.recall * 100)}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Recall</p>
          </Card>

          <Card className="p-6 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                <Award className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-green-500 text-white">+6%</Badge>
            </div>
            <div className="text-3xl text-gray-900 dark:text-white mb-1">
              {Math.round(performanceMetrics.f1Score * 100)}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">F1-Score</p>
          </Card>

          <Card className="p-6 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl text-gray-900 dark:text-white mb-1">
              {performanceMetrics.totalReviewed}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Reviewed</p>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Performance Trend */}
          <Card className="p-6 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl">
            <h3 className="text-gray-900 dark:text-white mb-1">Model Performance Over Time</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Before vs after feedback</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={combinedHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis domain={[0.7, 1]} stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Precision"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="Recall"
                  stroke="#a855f7"
                  strokeWidth={3}
                  dot={{ fill: '#a855f7', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="F1Score"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Top Rejection Reasons */}
          <Card className="p-6 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl">
            <h3 className="text-gray-900 dark:text-white mb-1">Top Rejection Reasons</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Help identify model weaknesses</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topRejectionReasons}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="reason" stroke="#888" angle={-20} textAnchor="end" height={80} />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                    <stop offset="100%" stopColor="#f87171" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Reviewer Leaderboard */}
        <Card className="p-6 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-gray-900 dark:text-white mb-1">Reviewer Leaderboard</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Top performers ranked by reviews and accuracy
              </p>
            </div>
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2">
              <Award className="w-4 h-4 mr-2 inline" />
              This Week
            </Badge>
          </div>

          <div className="space-y-3">
            {reviewerLeaderboard.map((reviewer, idx) => (
              <div
                key={reviewer.name}
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                  idx === 0
                    ? 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 ring-2 ring-yellow-400'
                    : 'bg-gray-50 dark:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                      idx === 0
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white'
                        : idx === 1
                        ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white'
                        : idx === 2
                        ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-gray-900 dark:text-white">{reviewer.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {reviewer.reviews} reviews
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                    <Badge className="bg-green-500 text-white mt-1">
                      {Math.round(reviewer.accuracy * 100)}%
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Avg Time</div>
                    <div className="text-sm text-gray-900 dark:text-white mt-1">{reviewer.avgTime}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Impact Summary */}
        <Card className="mt-8 p-8 backdrop-blur-xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-blue-200/50 dark:border-blue-800/50 shadow-xl text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-gray-900 dark:text-white mb-3">
              🎉 Your Team's Impact This Week
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thanks to your feedback, the model has improved significantly
            </p>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-3xl text-blue-600 dark:text-blue-400 mb-1">+3%</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Precision Increase</p>
              </div>
              <div>
                <div className="text-3xl text-purple-600 dark:text-purple-400 mb-1">+7%</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recall Increase</p>
              </div>
              <div>
                <div className="text-3xl text-green-600 dark:text-green-400 mb-1">432</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
