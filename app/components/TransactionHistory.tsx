import { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Calendar, Filter, Download, Search } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'added' | 'removed';
  marbleType: string;
  color: string;
  quantity: number;
  location: string;
  batchNumber: string;
  performedBy: string;
  timestamp: string;
  date: string;
  notes?: string;
}

const mockTransactions: Transaction[] = [
  {
    id: 'TXN001',
    type: 'added',
    marbleType: 'Carrara',
    color: 'White',
    quantity: 500,
    location: 'A-01',
    batchNumber: 'BATCH-2026-001',
    performedBy: 'John Doe',
    timestamp: '2026-01-09 09:15 AM',
    date: '2026-01-09',
    notes: 'New shipment arrival',
  },
  {
    id: 'TXN002',
    type: 'removed',
    marbleType: 'Nero Marquina',
    color: 'Black',
    quantity: 250,
    location: 'B-02',
    batchNumber: 'BATCH-2025-089',
    performedBy: 'Jane Smith',
    timestamp: '2026-01-08 04:30 PM',
    date: '2026-01-08',
    notes: 'Customer order #4523',
  },
  {
    id: 'TXN003',
    type: 'added',
    marbleType: 'Calacatta',
    color: 'Gold',
    quantity: 300,
    location: 'A-02',
    batchNumber: 'BATCH-2026-002',
    performedBy: 'John Doe',
    timestamp: '2026-01-08 02:15 PM',
    date: '2026-01-08',
  },
  {
    id: 'TXN004',
    type: 'removed',
    marbleType: 'Emperador',
    color: 'Brown',
    quantity: 150,
    location: 'C-01',
    batchNumber: 'BATCH-2025-078',
    performedBy: 'Michael Johnson',
    timestamp: '2026-01-08 11:20 AM',
    date: '2026-01-08',
    notes: 'Internal use - production',
  },
  {
    id: 'TXN005',
    type: 'added',
    marbleType: 'Statuario',
    color: 'White/Grey',
    quantity: 400,
    location: 'D-02',
    batchNumber: 'BATCH-2026-003',
    performedBy: 'Sarah Williams',
    timestamp: '2026-01-07 03:45 PM',
    date: '2026-01-07',
  },
  {
    id: 'TXN006',
    type: 'removed',
    marbleType: 'Crema Marfil',
    color: 'Beige',
    quantity: 200,
    location: 'B-01',
    batchNumber: 'BATCH-2025-092',
    performedBy: 'John Doe',
    timestamp: '2026-01-07 01:30 PM',
    date: '2026-01-07',
    notes: 'Customer order #4511',
  },
  {
    id: 'TXN007',
    type: 'added',
    marbleType: 'Rosso Verona',
    color: 'Red',
    quantity: 350,
    location: 'C-02',
    batchNumber: 'BATCH-2026-004',
    performedBy: 'Jane Smith',
    timestamp: '2026-01-06 10:15 AM',
    date: '2026-01-06',
  },
  {
    id: 'TXN008',
    type: 'removed',
    marbleType: 'Verde Guatemala',
    color: 'Green',
    quantity: 180,
    location: 'D-01',
    batchNumber: 'BATCH-2025-085',
    performedBy: 'Michael Johnson',
    timestamp: '2026-01-05 04:20 PM',
    date: '2026-01-05',
    notes: 'Customer order #4498',
  },
  {
    id: 'TXN009',
    type: 'added',
    marbleType: 'Carrara',
    color: 'White',
    quantity: 450,
    location: 'A-01',
    batchNumber: 'BATCH-2025-099',
    performedBy: 'Sarah Williams',
    timestamp: '2026-01-05 11:45 AM',
    date: '2026-01-05',
  },
  {
    id: 'TXN010',
    type: 'removed',
    marbleType: 'Calacatta',
    color: 'Gold',
    quantity: 220,
    location: 'A-02',
    batchNumber: 'BATCH-2025-091',
    performedBy: 'John Doe',
    timestamp: '2026-01-04 02:30 PM',
    date: '2026-01-04',
    notes: 'Customer order #4487',
  },
  {
    id: 'TXN011',
    type: 'added',
    marbleType: 'Emperador',
    color: 'Brown',
    quantity: 380,
    location: 'C-01',
    batchNumber: 'BATCH-2025-100',
    performedBy: 'Jane Smith',
    timestamp: '2026-01-03 09:20 AM',
    date: '2026-01-03',
  },
  {
    id: 'TXN012',
    type: 'removed',
    marbleType: 'Nero Marquina',
    color: 'Black',
    quantity: 160,
    location: 'B-02',
    batchNumber: 'BATCH-2025-087',
    performedBy: 'Michael Johnson',
    timestamp: '2026-01-02 03:15 PM',
    date: '2026-01-02',
    notes: 'Customer order #4472',
  },
];

export function TransactionHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'added' | 'removed'>('all');
  const [filterMarble, setFilterMarble] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Get unique marble types and users for filters
  const marbleTypes = Array.from(new Set(mockTransactions.map((t) => t.marbleType)));
  const users = Array.from(new Set(mockTransactions.map((t) => t.performedBy)));

  // Filter transactions
  const filteredTransactions = mockTransactions.filter((transaction) => {
    const matchesSearch =
      transaction.marbleType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.performedBy.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesMarble = filterMarble === 'all' || transaction.marbleType === filterMarble;
    const matchesUser = filterUser === 'all' || transaction.performedBy === filterUser;

    let matchesDate = true;
    if (dateFrom && dateTo) {
      const transactionDate = new Date(transaction.date);
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      matchesDate = transactionDate >= fromDate && transactionDate <= toDate;
    } else if (dateFrom) {
      const transactionDate = new Date(transaction.date);
      const fromDate = new Date(dateFrom);
      matchesDate = transactionDate >= fromDate;
    } else if (dateTo) {
      const transactionDate = new Date(transaction.date);
      const toDate = new Date(dateTo);
      matchesDate = transactionDate <= toDate;
    }

    return matchesSearch && matchesType && matchesMarble && matchesUser && matchesDate;
  });

  const handleExport = () => {
    alert('Exporting transaction history to CSV...');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterMarble('all');
    setFilterUser('all');
    setDateFrom('');
    setDateTo('');
  };

  // Calculate stats
  const totalAdded = filteredTransactions
    .filter((t) => t.type === 'added')
    .reduce((sum, t) => sum + t.quantity, 0);
  const totalRemoved = filteredTransactions
    .filter((t) => t.type === 'removed')
    .reduce((sum, t) => sum + t.quantity, 0);

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
                <p className="text-2xl font-semibold text-[#1F2937] dark:text-white">{filteredTransactions.length}</p>
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
                <p className="text-2xl font-semibold text-[#1F2937] dark:text-white">{totalAdded} kg</p>
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
                <p className="text-2xl font-semibold text-[#1F2937] dark:text-white">{totalRemoved} kg</p>
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Marble
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantity (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Batch Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Performed By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date & Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{transaction.id}</div>
                        {transaction.notes && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{transaction.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'added'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
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
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
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
                          {transaction.quantity} kg
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {transaction.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900 dark:text-gray-100">
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
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <p className="text-gray-500 dark:text-gray-400">No transactions found matching your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredTransactions.length} of {mockTransactions.length} transactions
        </div>
      </div>
    </div>
  );
}

