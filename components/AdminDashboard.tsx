import React from 'react';
import { Users, CheckCircle, XCircle, Clock, TrendingUp, Activity } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { performanceMetrics, reviewerLeaderboard } from '../mockData';

export function AdminDashboard() {
  const statusData = [
    { name: 'Confirmed', value: performanceMetrics.confirmed, color: '#10b981' },
    { name: 'Rejected', value: performanceMetrics.rejected, color: '#ef4444' },
    { name: 'Needs Review', value: performanceMetrics.needsReview, color: '#f59e0b' },
  ];

  const combinedHistory = performanceMetrics.precisionHistory.map((item, idx) => ({
    date: item.date.slice(5),
    Precision: item.value,
    Recall: performanceMetrics.recallHistory[idx].value,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 pt-24 pb-12 px-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8">
          <h1 className="text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            High-level overview of system performance and reviewer activity
          </p>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-white/20">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div className="text-4xl mb-1">{performanceMetrics.totalReviewed}</div>
            <p className="text-sm text-blue-100">Total Reviewed</p>
            <div className="mt-3 text-xs text-blue-100">
              of {performanceMetrics.totalRecords} records
            </div>
          </Card>

          <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-white/20">
                <CheckCircle className="w-6 h-6" />
              </div>
              <Badge className="bg-white/20 text-white">
                {Math.round((performanceMetrics.confirmed / performanceMetrics.totalReviewed) * 100)}%
              </Badge>
            </div>
            <div className="text-4xl mb-1">{performanceMetrics.confirmed}</div>
            <p className="text-sm text-green-100">Confirmed Matches</p>
          </Card>

          <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-white/20">
                <XCircle className="w-6 h-6" />
              </div>
              <Badge className="bg-white/20 text-white">
                {Math.round((performanceMetrics.rejected / performanceMetrics.totalReviewed) * 100)}%
              </Badge>
            </div>
            <div className="text-4xl mb-1">{performanceMetrics.rejected}</div>
            <p className="text-sm text-red-100">Rejected Matches</p>
          </Card>

          <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-white/20">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="text-4xl mb-1">{performanceMetrics.needsReview}</div>
            <p className="text-sm text-yellow-100">Needs Review</p>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Model Performance */}
          <Card className="col-span-2 p-6 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-gray-900 dark:text-white mb-1">Model Performance Trends</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Precision & Recall over time</p>
              </div>
              <Badge className="bg-green-500 text-white">
                <TrendingUp className="w-3 h-3 mr-1 inline" />
                Improving
              </Badge>
            </div>
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
                  dot={{ fill: '#3b82f6', r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Recall"
                  stroke="#a855f7"
                  strokeWidth={3}
                  dot={{ fill: '#a855f7', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Status Distribution */}
          <Card className="p-6 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl">
            <h3 className="text-gray-900 dark:text-white mb-1">Status Distribution</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Breakdown of all reviews</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Model Metrics Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="p-6 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-white">Precision</h3>
              <Badge className="bg-blue-500 text-white">+5%</Badge>
            </div>
            <div className="text-4xl text-blue-600 dark:text-blue-400 mb-2">
              {Math.round(performanceMetrics.precision * 100)}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              True positives / (True positives + False positives)
            </p>
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                style={{ width: `${performanceMetrics.precision * 100}%` }}
              />
            </div>
          </Card>

          <Card className="p-6 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-white">Recall</h3>
              <Badge className="bg-purple-500 text-white">+7%</Badge>
            </div>
            <div className="text-4xl text-purple-600 dark:text-purple-400 mb-2">
              {Math.round(performanceMetrics.recall * 100)}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              True positives / (True positives + False negatives)
            </p>
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                style={{ width: `${performanceMetrics.recall * 100}%` }}
              />
            </div>
          </Card>

          <Card className="p-6 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-white">F1-Score</h3>
              <Badge className="bg-green-500 text-white">+6%</Badge>
            </div>
            <div className="text-4xl text-green-600 dark:text-green-400 mb-2">
              {Math.round(performanceMetrics.f1Score * 100)}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Harmonic mean of precision and recall
            </p>
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600"
                style={{ width: `${performanceMetrics.f1Score * 100}%` }}
              />
            </div>
          </Card>
        </div>

        {/* Reviewer Productivity */}
        <Card className="p-6 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-gray-900 dark:text-white mb-1">Reviewer Productivity</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Team performance and activity
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-900 dark:text-white">{reviewerLeaderboard.length} Active Reviewers</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm text-gray-600 dark:text-gray-400">Rank</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600 dark:text-gray-400">Reviewer</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600 dark:text-gray-400">Reviews</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600 dark:text-gray-400">Accuracy</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600 dark:text-gray-400">Avg Time</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {reviewerLeaderboard.map((reviewer, idx) => (
                  <tr
                    key={reviewer.name}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          idx === 0
                            ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {idx + 1}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-gray-900 dark:text-white">{reviewer.name}</div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className="bg-blue-500 text-white">{reviewer.reviews}</Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className="bg-green-500 text-white">
                        {Math.round(reviewer.accuracy * 100)}%
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900 dark:text-white">{reviewer.avgTime}</span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* System Health */}
        <Card className="mt-8 p-6 backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-200/50 dark:border-green-800/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-900 dark:text-white mb-2">System Health</h3>
              <p className="text-gray-600 dark:text-gray-400">All systems operational</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl text-green-600 dark:text-green-400 mb-1">99.8%</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Uptime</p>
              </div>
              <div className="text-center">
                <div className="text-2xl text-blue-600 dark:text-blue-400 mb-1">1.2s</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Avg Response</p>
              </div>
              <div className="text-center">
                <div className="text-2xl text-purple-600 dark:text-purple-400 mb-1">432</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Daily Reviews</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
