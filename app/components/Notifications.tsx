'use client'

import { AlertTriangle, CheckCircle, Info, Package, Clock } from 'lucide-react';

interface Notification {
  id: string;
  type: 'low-stock' | 'stock-added' | 'stock-removed' | 'info';
  message: string;
  timestamp: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'low-stock',
    message: 'Low stock alert: Crema Marfil Beige is below threshold (150 kg remaining)',
    timestamp: '2026-01-09 09:15 AM',
    read: false,
  },
  {
    id: '2',
    type: 'low-stock',
    message: 'Low stock alert: Emperador Brown is below threshold (320 kg remaining)',
    timestamp: '2026-01-09 08:45 AM',
    read: false,
  },
  {
    id: '3',
    type: 'stock-added',
    message: 'Stock added: 500 kg of Carrara White added to location A-01',
    timestamp: '2026-01-08 04:30 PM',
    read: true,
  },
  {
    id: '4',
    type: 'stock-removed',
    message: 'Stock removed: 250 kg of Nero Marquina Black removed from location B-02',
    timestamp: '2026-01-08 02:15 PM',
    read: true,
  },
  {
    id: '5',
    type: 'info',
    message: 'Monthly usage report for December 2025 is now available',
    timestamp: '2026-01-08 10:00 AM',
    read: true,
  },
  {
    id: '6',
    type: 'stock-added',
    message: 'Stock added: 300 kg of Statuario White/Grey added to location D-02',
    timestamp: '2026-01-07 03:45 PM',
    read: true,
  },
  {
    id: '7',
    type: 'low-stock',
    message: 'Critical: Verde Guatemala Green is out of stock (0 kg remaining)',
    timestamp: '2026-01-06 11:20 AM',
    read: true,
  },
  {
    id: '8',
    type: 'stock-removed',
    message: 'Stock removed: 150 kg of Calacatta Gold removed from location A-02',
    timestamp: '2026-01-05 01:30 PM',
    read: true,
  },
];

export function Notifications() {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'low-stock':
        return <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />;
      case 'stock-added':
        return <CheckCircle className="w-5 h-5 text-[#16A34A]" />;
      case 'stock-removed':
        return <Package className="w-5 h-5 text-[#DC2626]" />;
      case 'info':
        return <Info className="w-5 h-5 text-[#2563EB]" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'low-stock':
        return 'bg-orange-50 border-orange-200';
      case 'stock-added':
        return 'bg-green-50 border-green-200';
      case 'stock-removed':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-[#1F2937]">Notifications</h3>
              <p className="text-sm text-gray-600 mt-1">
                Stay updated with inventory changes and alerts
              </p>
            </div>
            {unreadCount > 0 && (
              <div className="px-4 py-2 bg-[#2563EB] text-white rounded-full text-sm font-medium">
                {unreadCount} Unread
              </div>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {mockNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 transition-colors hover:bg-gray-50 ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center border ${getNotificationColor(
                      notification.type
                    )}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <p
                        className={`text-sm ${
                          !notification.read
                            ? 'font-medium text-[#1F2937]'
                            : 'text-gray-700'
                        }`}
                      >
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-[#2563EB] rounded-full" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{notification.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State (hidden when notifications exist) */}
        {mockNotifications.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h4>
            <p className="text-sm text-gray-500">
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

