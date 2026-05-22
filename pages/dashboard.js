import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Activity, Clock, DollarSign, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    loadLogs();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics/dashboard');
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/analytics/logs?limit=50');
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-gray-400">Loading analytics...</div>
        </div>
      </div>
    );
  }

  const overview = analytics?.overview || {};
  const byProvider = analytics?.byProvider || [];
  const errorRate = (analytics?.errorRate || 0) * 100;

  const latencyData = [
    { name: 'P50', value: parseFloat(overview.p50_latency) || 0 },
    { name: 'P95', value: parseFloat(overview.p95_latency) || 0 },
    { name: 'P99', value: parseFloat(overview.p99_latency) || 0 },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="bg-[#2A2A2A] hover:bg-[#333333] p-2.5 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#171717] p-6 rounded-xl border border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="text-gray-400 text-sm font-medium">Total Requests</div>
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Activity className="text-blue-500" size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold">{overview.total_requests || 0}</div>
            <div className="text-xs text-gray-500 mt-1">All time</div>
          </div>

          <div className="bg-[#171717] p-6 rounded-xl border border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="text-gray-400 text-sm font-medium">Avg Latency</div>
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Clock className="text-green-500" size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold">
              {Math.round(overview.avg_latency || 0)}ms
            </div>
            <div className="text-xs text-gray-500 mt-1">Average response time</div>
          </div>

          <div className="bg-[#171717] p-6 rounded-xl border border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="text-gray-400 text-sm font-medium">Total Cost</div>
              <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="text-yellow-500" size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold">
              ${parseFloat(overview.total_cost || 0).toFixed(4)}
            </div>
            <div className="text-xs text-gray-500 mt-1">API usage cost</div>
          </div>

          <div className="bg-[#171717] p-6 rounded-xl border border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="text-gray-400 text-sm font-medium">Error Rate</div>
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-red-500" size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold">{errorRate.toFixed(2)}%</div>
            <div className="text-xs text-gray-500 mt-1">Failed requests</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="bg-[#171717] p-6 rounded-xl border border-[#2A2A2A]">
            <h2 className="text-xl font-semibold mb-6">Latency Percentiles</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="name" stroke="#666666" />
                <YAxis stroke="#666666" />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#171717', 
                    border: '1px solid #2A2A2A',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#171717] p-6 rounded-xl border border-[#2A2A2A]">
            <h2 className="text-xl font-semibold mb-6">Provider Stats</h2>
            <div className="space-y-4">
              {byProvider.length > 0 ? byProvider.map((provider, idx) => (
                <div key={idx} className="bg-[#0A0A0A] p-4 rounded-lg border border-[#2A2A2A]">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold text-gray-200">{provider.model}</div>
                    <div className="text-sm text-gray-500">
                      {provider.request_count} requests
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Avg: {Math.round(provider.avg_latency)}ms</span>
                    <span>Tokens: {provider.total_tokens || 0}</span>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-8">
                  No data available yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-[#171717] p-6 rounded-xl border border-[#2A2A2A]">
          <h2 className="text-xl font-semibold mb-6">Recent Inference Logs</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Model</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Latency</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tokens</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Cost</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#2A2A2A] hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">{log.model}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{log.latencyMs}ms</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{log.totalTokens || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      ${log.costEstimate?.toFixed(6) || '0.000000'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          log.status === 'success'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      No logs available yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
