'use client'

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, Package, Clock } from 'lucide-react';
import { notificationAPI } from '@/lib/api';

interface Notification {
  id: number;
  type: 'low-stock' | 'stock-added' | 'stock-removed' | 'info';
  message: string;
  createdAt: string;
  read: boolean;
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getAll();
      setNotifications(response.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-[#1F2937] dark:text-white">Notifications</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Stay updated with inventory changes and alerts
              </p>
            </div>
            {unreadCount > 0 && (
              <div className="px-4 py-2 bg-[#2563EB] dark:bg-blue-600 text-white rounded-full text-sm font-medium">
                {unreadCount} Unread
              </div>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading notifications...
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  !notification.read ? 'bg-blue-50 dark:bg-gray-800' : ''
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
                            ? 'font-medium text-[#1F2937] dark:text-white'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-[#2563EB] dark:bg-blue-400 rounded-full" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(notification.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty State (hidden when notifications exist) */}
        {!loading && notifications.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Notifications</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

