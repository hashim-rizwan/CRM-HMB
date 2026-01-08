'use client'

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, Calendar, Filter } from 'lucide-react';

const monthlyData = [
  { month: 'Jul', added: 3200, removed: 2800, net: 400 },
  { month: 'Aug', added: 2900, removed: 3100, net: -200 },
  { month: 'Sep', added: 3500, removed: 2900, net: 600 },
  { month: 'Oct', added: 4100, removed: 3400, net: 700 },
  { month: 'Nov', added: 3800, removed: 3600, net: 200 },
  { month: 'Dec', added: 4500, removed: 4200, net: 300 },
];

const usageByType = [
  { type: 'Carrara', usage: 2840, percentage: 28 },
  { type: 'Calacatta', usage: 1920, percentage: 19 },
  { type: 'Emperador', usage: 1530, percentage: 15 },
  { type: 'Nero Marquina', usage: 1430, percentage: 14 },
  { type: 'Statuario', usage: 1210, percentage: 12 },
  { type: 'Others', usage: 1270, percentage: 12 },
];

const trendData = [
  { month: 'Jul', inventory: 8200 },
  { month: 'Aug', inventory: 8000 },
  { month: 'Sep', inventory: 8600 },
  { month: 'Oct', inventory: 9300 },
  { month: 'Nov', inventory: 9500 },
  { month: 'Dec', inventory: 9800 },
];

export function MonthlyReport() {
  const [selectedMonth, setSelectedMonth] = useState('December 2025');
  const [reportType, setReportType] = useState('usage');

  const handleExport = () => {
    alert('Exporting report as PDF...');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-semibold text-[#1F2937] mb-1">Monthly Usage Report</h3>
          <p className="text-sm text-gray-600">Inventory analytics and usage statistics</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Month Selector */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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
            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Added</p>
          <p className="text-3xl font-semibold text-[#16A34A] mb-2">4,500 kg</p>
          <p className="text-xs text-gray-500">+12% from last month</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Removed</p>
          <p className="text-3xl font-semibold text-[#DC2626] mb-2">4,200 kg</p>
          <p className="text-xs text-gray-500">+8% from last month</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Net Change</p>
          <p className="text-3xl font-semibold text-[#2563EB] mb-2">+300 kg</p>
          <p className="text-xs text-gray-500">Positive growth</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Turnover Rate</p>
          <p className="text-3xl font-semibold text-[#1F2937] mb-2">42.8%</p>
          <p className="text-xs text-gray-500">Industry average</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Activity Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="font-semibold text-[#1F2937] mb-4">Monthly Stock Movement</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="added" fill="#16A34A" name="Added (kg)" />
              <Bar dataKey="removed" fill="#DC2626" name="Removed (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="font-semibold text-[#1F2937] mb-4">Inventory Level Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Legend />
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="font-semibold text-[#1F2937]">Usage by Marble Type</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marble Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distribution</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usageByType.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-[#1F2937]">{item.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{item.usage.toLocaleString()} kg</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.percentage}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                        <div 
                          className="bg-[#2563EB] h-2 rounded-full" 
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
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Total usage across all marble types
            </p>
            <p className="font-semibold text-[#1F2937]">
              {usageByType.reduce((sum, item) => sum + item.usage, 0).toLocaleString()} kg
            </p>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h5 className="font-semibold text-[#1F2937] mb-3">Top Performer</h5>
          <p className="text-2xl font-semibold text-[#16A34A] mb-1">Carrara</p>
          <p className="text-sm text-gray-600">Most used marble type this month</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h5 className="font-semibold text-[#1F2937] mb-3">Average Daily Usage</h5>
          <p className="text-2xl font-semibold text-[#2563EB] mb-1">135.5 kg</p>
          <p className="text-sm text-gray-600">Based on 31 days</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h5 className="font-semibold text-[#1F2937] mb-3">Reorder Alert</h5>
          <p className="text-2xl font-semibold text-[#F59E0B] mb-1">2 Items</p>
          <p className="text-sm text-gray-600">Below minimum stock level</p>
        </div>
      </div>
    </div>
  );
}

