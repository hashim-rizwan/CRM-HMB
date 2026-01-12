'use client'

import { useState, useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Calendar, Filter, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { transactionsAPI } from '@/lib/api';

interface Transaction {
  id: string;
  type: 'added' | 'removed';
  marbleType: string;
  color: string;
  quantity: number;
  unit?: string;
  batchNumber: string;
  performedBy: string;
  timestamp: string;
  date: string;
  reason?: string;
  notes?: string;
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'added' | 'removed'>('all');
  const [filterMarble, setFilterMarble] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [marbleTypes, setMarbleTypes] = useState<string[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);
  const [stats, setStats] = useState<{
    totalAdded: number;
    totalRemoved: number;
  } | null>(null);

  // Fetch transactions from API
  useEffect(() => {
    fetchTransactions();
  }, [filterType, filterMarble, filterUser, dateFrom, dateTo, searchQuery, page, limit]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterType, filterMarble, filterUser, dateFrom, dateTo, searchQuery]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await transactionsAPI.getAll({
        search: searchQuery || undefined,
        type: filterType === 'all' ? undefined : filterType === 'added' ? 'IN' : 'OUT',
        marbleType: filterMarble !== 'all' ? filterMarble : undefined,
        requestedBy: filterUser !== 'all' ? filterUser : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        page,
        limit,
      });

      setTransactions(response.transactions || []);
      setMarbleTypes(response.filters?.marbleTypes || []);
      setUsers(response.filters?.users || []);
      setPagination(response.pagination || null);
      setStats(response.stats || null);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions (additional client-side filtering if needed)
  const filteredTransactions = transactions;

  const handleExport = () => {
    try {
      // Prepare CSV data
      const headers = [
        'Transaction ID',
        'Type',
        'Marble Type',
        'Color',
        'Quantity',
        'Unit',
        'Batch Number',
        'Performed By',
        'Date & Time',
        'Reason',
        'Notes',
      ];

      const csvRows = [
        headers.join(','),
        ...filteredTransactions.map((txn) => {
          return [
            txn.id,
            txn.type === 'added' ? 'Added' : 'Removed',
            `"${txn.marbleType}"`,
            `"${txn.color}"`,
            txn.quantity,
            txn.unit || 'kg',
            txn.batchNumber,
            `"${txn.performedBy}"`,
            txn.timestamp,
            txn.reason ? `"${txn.reason}"` : '',
            txn.notes ? `"${txn.notes}"` : '',
          ].join(',');
        }),
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `transaction-history-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      alert('Failed to export transaction history');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterMarble('all');
    setFilterUser('all');
    setDateFrom('');
    setDateTo('');
  };

  // Use stats from API (for all filtered transactions) or calculate from current page
  const totalAdded = stats?.totalAdded ?? filteredTransactions
    .filter((t) => t.type === 'added')
    .reduce((sum, t) => sum + t.quantity, 0);
  const totalRemoved = stats?.totalRemoved ?? filteredTransactions
    .filter((t) => t.type === 'removed')
    .reduce((sum, t) => sum + t.quantity, 0);
  
  // Get the unit for display (use the most common unit or default to kg)
  const getDisplayUnit = () => {
    if (filteredTransactions.length === 0) return 'kg';
    const units = filteredTransactions.map(t => t.unit || 'kg');
    const unitCounts = units.reduce((acc, unit) => {
      acc[unit] = (acc[unit] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(unitCounts).reduce((a, b) => unitCounts[a] > unitCounts[b] ? a : b, 'kg');
  };
  
  const displayUnit = getDisplayUnit();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-semibold text-[#1F2937] dark:text-white">Transaction History</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Complete history of all inventory transactions
            </p>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-[#16A34A] text-white rounded-lg hover:bg-[#15803D] transition-colors flex items-center gap-2 font-medium"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#2563EB] dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                <p className="text-2xl font-semibold text-[#1F2937] dark:text-white">{pagination?.total ?? filteredTransactions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <ArrowUpCircle className="w-6 h-6 text-[#16A34A] dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Stock Added</p>
                <p className="text-2xl font-semibold text-[#1F2937] dark:text-white">{totalAdded.toLocaleString()} {displayUnit}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <ArrowDownCircle className="w-6 h-6 text-[#DC2626] dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Stock Removed</p>
                <p className="text-2xl font-semibold text-[#1F2937] dark:text-white">{totalRemoved.toLocaleString()} {displayUnit}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h4 className="font-semibold text-[#1F2937] dark:text-white">Filters</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by marble, batch, ID, or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transaction Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="added">Stock Added</option>
                <option value="removed">Stock Removed</option>
              </select>
            </div>

            {/* Marble Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Marble Type</label>
              <select
                value={filterMarble}
                onChange={(e) => setFilterMarble(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Marbles</option>
                {marbleTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* User Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Performed By</label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Users</option>
                {users.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Clear All Filters
          </button>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Marble
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quantity (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Batch Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Performed By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date & Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-gray-500 dark:text-gray-400">Loading transactions...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-red-500 dark:text-red-400">{error}</p>
                    </td>
                  </tr>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{transaction.id}</div>
                        {(transaction.notes || transaction.reason) && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {transaction.reason && <span className="font-medium">Reason: {transaction.reason}</span>}
                            {transaction.reason && transaction.notes && ' • '}
                            {transaction.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'added'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {transaction.type === 'added' ? (
                            <ArrowUpCircle className="w-3 h-3" />
                          ) : (
                            <ArrowDownCircle className="w-3 h-3" />
                          )}
                          {transaction.type === 'added' ? 'Added' : 'Removed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {transaction.marbleType}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{transaction.color}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-semibold ${
                            transaction.type === 'added' ? 'text-[#16A34A] dark:text-green-400' : 'text-[#DC2626] dark:text-red-400'
                          }`}
                        >
                          {transaction.type === 'added' ? '+' : '-'}
                          {transaction.quantity} {transaction.unit || 'kg'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900 dark:text-white">
                          {transaction.batchNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {transaction.performedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {transaction.timestamp}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-gray-500 dark:text-gray-400">No transactions found matching your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination and Results Count */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {pagination ? (
              <>
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} transaction{pagination.total !== 1 ? 's' : ''}
              </>
            ) : (
              <>
                Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
              </>
            )}
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              {/* Page Size Selector */}
              <div className="flex items-center gap-2 mr-4">
                <label className="text-sm text-gray-600 dark:text-gray-400">Show:</label>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Previous Button */}
              <button
                onClick={() => setPage(page - 1)}
                disabled={!pagination.hasPrevPage}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pagination.hasPrevPage
                    ? 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4 inline mr-1" />
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        page === pageNum
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNextPage}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pagination.hasNextPage
                    ? 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                Next
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

