'use client'

import { useState, useEffect } from 'react';
import { Package, Search, Download, Calendar, User, Phone, Mail } from 'lucide-react';

interface ReservedStockItem {
  id: number;
  marbleType: string;
  shade: string;
  quantity: number;
  slabSizeLength: number;
  slabSizeWidth: number;
  numberOfSlabs: number;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  reservedBy?: string;
  notes?: string;
  status: string;
  reservedAt: string;
  releasedAt?: string;
}

export function ReservedStock() {
  const [reservedStocks, setReservedStocks] = useState<ReservedStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchReservedStocks();
  }, [page, limit, searchQuery, statusFilter]);

  const fetchReservedStocks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/stock/reserved?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setReservedStocks(data.reservedStocks || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 0);
      }
    } catch (error) {
      console.error('Error fetching reserved stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (id: number) => {
    if (!confirm('Are you sure you want to release this reservation?')) return;

    try {
      const response = await fetch(`/api/stock/reserved/${id}/release`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        fetchReservedStocks();
        alert('Reservation released successfully');
      } else {
        alert(data.error || 'Failed to release reservation');
      }
    } catch (error) {
      console.error('Error releasing reservation:', error);
      alert('Failed to release reservation');
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Marble Type', 'Shade', 'Quantity (sq ft)', 'Slab Size', 'Number of Slabs', 'Client Name', 'Client Phone', 'Client Email', 'Status', 'Reserved At', 'Released At'];
    const rows = reservedStocks.map(item => [
      item.id,
      item.marbleType,
      item.shade,
      item.quantity,
      `${item.slabSizeLength}×${item.slabSizeWidth}`,
      item.numberOfSlabs,
      item.clientName,
      item.clientPhone || '',
      item.clientEmail || '',
      item.status,
      new Date(item.reservedAt).toLocaleDateString(),
      item.releasedAt ? new Date(item.releasedAt).toLocaleDateString() : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reserved-stock-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredStocks = reservedStocks.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.marbleType.toLowerCase().includes(searchLower) ||
      item.shade.toLowerCase().includes(searchLower) ||
      item.clientName.toLowerCase().includes(searchLower) ||
      (item.clientPhone && item.clientPhone.includes(searchQuery)) ||
      (item.clientEmail && item.clientEmail.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-2">Reserved Stock</h2>
            <p className="text-gray-600 dark:text-gray-400">View and manage stock reservations for clients</p>
          </div>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-[#16A34A] dark:bg-green-600 text-white rounded-lg hover:bg-[#15803D] dark:hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by marble type, shade, client name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="Reserved">Reserved</option>
            <option value="Released">Released</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Reservations</p>
            <p className="text-2xl font-bold text-[#1F2937] dark:text-white">{total}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Reservations</p>
            <p className="text-2xl font-bold text-[#F59E0B] dark:text-yellow-400">
              {reservedStocks.filter(s => s.status === 'Reserved').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Reserved Quantity</p>
            <p className="text-2xl font-bold text-[#1F2937] dark:text-white">
              {reservedStocks.reduce((sum, s) => sum + s.quantity, 0).toLocaleString()} sq ft
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Reserved Quantity</p>
            <p className="text-2xl font-bold text-[#F59E0B] dark:text-yellow-400">
              {reservedStocks.filter(s => s.status === 'Reserved').reduce((sum, s) => sum + s.quantity, 0).toLocaleString()} sq ft
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : filteredStocks.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No reserved stock found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Marble Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Shade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Slab Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reserved At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredStocks.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.marbleType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.shade}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.quantity.toLocaleString()} sq ft</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.slabSizeLength}×{item.slabSizeWidth} ({item.numberOfSlabs} slabs)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex flex-col">
                            <span className="font-medium">{item.clientName}</span>
                            {item.clientPhone && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {item.clientPhone}
                              </span>
                            )}
                            {item.clientEmail && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {item.clientEmail}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.status === 'Reserved' 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : item.status === 'Released'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(item.reservedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.status === 'Reserved' && (
                            <button
                              onClick={() => handleRelease(item.id)}
                              className="text-[#16A34A] hover:text-[#15803D] dark:text-green-400 dark:hover:text-green-300"
                            >
                              Release
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} reservations
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
