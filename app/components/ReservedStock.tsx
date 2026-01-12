'use client'

import { useState, useEffect } from 'react';
import { Package, Search, Download, Calendar, User, Phone, Mail, X, AlertCircle, CheckCircle, Truck } from 'lucide-react';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [reservationToRelease, setReservationToRelease] = useState<ReservedStockItem | null>(null);
  const [reservationToCheckout, setReservationToCheckout] = useState<ReservedStockItem | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

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

  const handleReleaseClick = (item: ReservedStockItem) => {
    setReservationToRelease(item);
    setShowConfirmModal(true);
  };

  const handleConfirmRelease = async () => {
    if (!reservationToRelease) return;

    setReleasing(true);
    try {
      const response = await fetch(`/api/stock/reserved/${reservationToRelease.id}/release`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setNotification({
          type: 'success',
          message: 'Reservation released successfully',
        });
        setShowConfirmModal(false);
        setReservationToRelease(null);
        fetchReservedStocks();
        // Auto-hide notification after 3 seconds
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to release reservation',
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Error releasing reservation:', error);
      setNotification({
        type: 'error',
        message: 'Failed to release reservation',
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setReleasing(false);
    }
  };

  const handleCancelRelease = () => {
    setShowConfirmModal(false);
    setReservationToRelease(null);
  };

  const handleCheckoutClick = (item: ReservedStockItem) => {
    setReservationToCheckout(item);
    setShowCheckoutModal(true);
  };

  const handleConfirmCheckout = async () => {
    if (!reservationToCheckout) return;

    setCheckingOut(true);
    try {
      const response = await fetch(`/api/stock/reserved/${reservationToCheckout.id}/checkout`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setNotification({
          type: 'success',
          message: 'Reservation marked as delivered successfully',
        });
        setShowCheckoutModal(false);
        setReservationToCheckout(null);
        fetchReservedStocks();
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to mark as delivered',
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Error checking out reservation:', error);
      setNotification({
        type: 'error',
        message: 'Failed to mark as delivered',
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleCancelCheckout = () => {
    setShowCheckoutModal(false);
    setReservationToCheckout(null);
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
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && reservationToRelease && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1F2937] dark:text-white">
                Release Reservation
              </h3>
              <button
                onClick={handleCancelRelease}
                disabled={releasing}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to release this reservation? The stock will be <strong>added back to inventory</strong>.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Marble Type:</span>
                  <span className="text-sm font-medium text-[#1F2937] dark:text-white">{reservationToRelease.marbleType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Shade:</span>
                  <span className="text-sm font-medium text-[#1F2937] dark:text-white">{reservationToRelease.shade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Quantity:</span>
                  <span className="text-sm font-medium text-[#1F2937] dark:text-white">{reservationToRelease.quantity.toLocaleString()} sq ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Slab Size:</span>
                  <span className="text-sm font-medium text-[#1F2937] dark:text-white">
                    {reservationToRelease.slabSizeLength}×{reservationToRelease.slabSizeWidth} ({reservationToRelease.numberOfSlabs} slabs)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Client:</span>
                  <span className="text-sm font-medium text-[#1F2937] dark:text-white">{reservationToRelease.clientName}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelRelease}
                disabled={releasing}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRelease}
                disabled={releasing}
                className="flex-1 px-4 py-2 bg-[#16A34A] dark:bg-green-600 text-white rounded-lg hover:bg-[#15803D] dark:hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {releasing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Releasing...</span>
                  </>
                ) : (
                  'Confirm Release'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout/Delivery Confirmation Modal */}
      {showCheckoutModal && reservationToCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1F2937] dark:text-white">
                Mark as Delivered
              </h3>
              <button
                onClick={handleCancelCheckout}
                disabled={checkingOut}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Mark this reservation as delivered? The stock will <strong>NOT</strong> be added back to inventory.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Marble Type:</span>
                  <span className="text-sm font-medium text-[#1F2937] dark:text-white">{reservationToCheckout.marbleType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Shade:</span>
                  <span className="text-sm font-medium text-[#1F2937] dark:text-white">{reservationToCheckout.shade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Quantity:</span>
                  <span className="text-sm font-medium text-[#1F2937] dark:text-white">{reservationToCheckout.quantity.toLocaleString()} sq ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Slab Size:</span>
                  <span className="text-sm font-medium text-[#1F2937] dark:text-white">
                    {reservationToCheckout.slabSizeLength}×{reservationToCheckout.slabSizeWidth} ({reservationToCheckout.numberOfSlabs} slabs)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Client:</span>
                  <span className="text-sm font-medium text-[#1F2937] dark:text-white">{reservationToCheckout.clientName}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelCheckout}
                disabled={checkingOut}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCheckout}
                disabled={checkingOut}
                className="flex-1 px-4 py-2 bg-[#2563EB] dark:bg-blue-600 text-white rounded-lg hover:bg-[#1D4ED8] dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    <span>Mark as Delivered</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <option value="Delivered">Delivered</option>
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
                              : item.status === 'Delivered'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
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
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleReleaseClick(item)}
                                className="text-[#16A34A] hover:text-[#15803D] dark:text-green-400 dark:hover:text-green-300 font-medium"
                                title="Release back to inventory"
                              >
                                Release
                              </button>
                              <button
                                onClick={() => handleCheckoutClick(item)}
                                className="text-[#2563EB] hover:text-[#1D4ED8] dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                                title="Mark as delivered (client has taken delivery)"
                              >
                                <Truck className="w-4 h-4" />
                                Delivered
                              </button>
                            </div>
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
