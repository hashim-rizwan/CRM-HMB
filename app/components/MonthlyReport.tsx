'use client'

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, Calendar, Filter } from 'lucide-react';
import { reportsAPI } from '@/lib/api';

interface MonthlyReportProps {
  searchQuery?: string;
}

export function MonthlyReport({ searchQuery = '' }: MonthlyReportProps) {
  const [selectedMonth, setSelectedMonth] = useState('December 2025');
  const [reportType, setReportType] = useState('usage');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [usageByType, setUsageByType] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getMonthly(selectedMonth);
      setMonthlyData(response.monthlyData || []);
      setUsageByType(response.usageByType || []);
      setTrendData(response.trendData || []);
    } catch (err) {
      console.error('Error fetching report data:', err);
      // Fallback to empty arrays
      setMonthlyData([]);
      setUsageByType([]);
      setTrendData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    alert('Exporting report as PDF...');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-semibold text-[#1F2937] dark:text-white mb-1">Monthly Usage Report</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Inventory analytics and usage statistics</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Month Selector */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
            >
              <option>December 2025</option>
              <option>November 2025</option>
              <option>October 2025</option>
              <option>September 2025</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-[#2563EB] dark:bg-blue-600 text-white rounded-lg hover:bg-[#1D4ED8] dark:hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Added</p>
          <p className="text-3xl font-semibold text-[#16A34A] dark:text-green-400 mb-2">4,500 kg</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">+12% from last month</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Removed</p>
          <p className="text-3xl font-semibold text-[#DC2626] dark:text-red-400 mb-2">4,200 kg</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">+8% from last month</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Change</p>
          <p className="text-3xl font-semibold text-[#2563EB] dark:text-blue-400 mb-2">+300 kg</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Positive growth</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Turnover Rate</p>
          <p className="text-3xl font-semibold text-[#1F2937] dark:text-white mb-2">42.8%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Industry average</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Activity Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h4 className="font-semibold text-[#1F2937] dark:text-white mb-4">Monthly Stock Movement</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
              <XAxis dataKey="month" stroke="#6B7280" className="dark:stroke-gray-400" />
              <YAxis stroke="#6B7280" className="dark:stroke-gray-400" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#1F2937' : 'white',
                  border: `1px solid ${isDarkMode ? '#4B5563' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: isDarkMode ? '#fff' : '#000'
                }}
              />
              <Legend wrapperStyle={{ color: isDarkMode ? '#fff' : '#1F2937' }} />
              <Bar dataKey="added" fill="#16A34A" name="Added (kg)" />
              <Bar dataKey="removed" fill="#DC2626" name="Removed (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Trend Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h4 className="font-semibold text-[#1F2937] dark:text-white mb-4">Inventory Level Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
              <XAxis dataKey="month" stroke="#6B7280" className="dark:stroke-gray-400" />
              <YAxis stroke="#6B7280" className="dark:stroke-gray-400" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#1F2937' : 'white',
                  border: `1px solid ${isDarkMode ? '#4B5563' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: isDarkMode ? '#fff' : '#000'
                }}
              />
              <Legend wrapperStyle={{ color: isDarkMode ? '#fff' : '#1F2937' }} />
              <Line 
                type="monotone" 
                dataKey="inventory" 
                stroke="#2563EB" 
                strokeWidth={2}
                name="Total Inventory (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Usage by Type Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h4 className="font-semibold text-[#1F2937] dark:text-white">Usage by Marble Type</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Marble Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Percentage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Distribution</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {usageByType.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-[#1F2937] dark:text-white">{item.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{item.usage.toLocaleString()} kg</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{item.percentage}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-xs">
                        <div 
                          className="bg-[#2563EB] dark:bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total usage across all marble types
            </p>
            <p className="font-semibold text-[#1F2937] dark:text-white">
              {usageByType.reduce((sum, item) => sum + item.usage, 0).toLocaleString()} kg
            </p>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h5 className="font-semibold text-[#1F2937] dark:text-white mb-3">Top Performer</h5>
          <p className="text-2xl font-semibold text-[#16A34A] dark:text-green-400 mb-1">Carrara</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Most used marble type this month</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h5 className="font-semibold text-[#1F2937] dark:text-white mb-3">Average Daily Usage</h5>
          <p className="text-2xl font-semibold text-[#2563EB] dark:text-blue-400 mb-1">135.5 kg</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Based on 31 days</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h5 className="font-semibold text-[#1F2937] dark:text-white mb-3">Reorder Alert</h5>
          <p className="text-2xl font-semibold text-[#F59E0B] dark:text-orange-400 mb-1">2 Items</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Below minimum stock level</p>
        </div>
      </div>
    </div>
  );
}

