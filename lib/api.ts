// API utility functions for making requests

const API_BASE = '/api';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    // Handle network errors
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('Unable to connect to server. Please make sure the development server is running.');
    }
    throw error;
  }
}

// Stock Management APIs
export const stockAPI = {
  add: (data: {
    marbleType: string;
    color?: string;
    quantity: number;
    unit: string;
    location: string;
    supplier?: string;
    batchNumber?: string;
    costPrice?: number;
    salePrice?: number;
    notes?: string;
    barcode?: string;
  }) => apiRequest<{ success: boolean; marble: any }>('/stock/add', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  remove: (data: {
    marbleType: string;
    quantity: number;
    reason: string;
    requestedBy?: string;
    notes?: string;
  }) => apiRequest<{ success: boolean; marble: any }>('/stock/remove', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Inventory APIs
export const inventoryAPI = {
  getAll: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest<{ success: boolean; marbles: any[] }>(`/inventory${query}`);
  },

  getStats: () =>
    apiRequest<{
      success: boolean;
      stats: {
        totalItems: number;
        totalQuantity: number;
        lowStockCount: number;
        outOfStockCount: number;
        totalInventoryValue: number;
      };
    }>('/inventory/stats'),
};

// User Management APIs
export const userAPI = {
  getAll: () =>
    apiRequest<{ success: boolean; users: any[] }>('/users'),

  create: (data: {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone?: string;
    role?: string;
    department?: string;
  }) =>
    apiRequest<{ success: boolean; user: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: {
    fullName?: string;
    email?: string;
    phone?: string;
    role?: string;
    department?: string;
  }) =>
    apiRequest<{ success: boolean; user: any }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: number, status: 'Active' | 'Disabled') =>
    apiRequest<{ success: boolean; user: any }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// Notifications API
export const notificationAPI = {
  getAll: () =>
    apiRequest<{ success: boolean; notifications: any[] }>('/notifications'),

  markAsRead: (id: number) =>
    apiRequest<{ success: boolean; notification: any }>('/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ id, read: true }),
    }),

  markAllAsRead: () =>
    apiRequest<{ success: boolean }>('/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ read: true }),
    }),
};

// Authentication API
export const authAPI = {
  login: (username: string, password: string) =>
    apiRequest<{ success: boolean; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

// Barcodes API
export const barcodeAPI = {
  getAll: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest<{ success: boolean; barcodes: any[] }>(`/barcodes${query}`);
  },
};

// Reports API
export const reportsAPI = {
  getMonthly: (month?: string) => {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return apiRequest<{
      success: boolean;
      monthlyData: any[];
      usageByType: any[];
      trendData: any[];
    }>(`/reports/monthly${query}`);
  },
};

