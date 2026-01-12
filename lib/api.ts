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
    isNewItem?: boolean;
  }) => apiRequest<{ success: boolean; marble: any; batchNumber?: string }>('/stock/add', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  remove: (data: {
    barcode?: string;
    marbleType: string;
    shade: string;
    slabSizeLength: number;
    slabSizeWidth: number;
    numberOfSlabs: number;
    reason: string;
    notes?: string;
  }) => apiRequest<{ success: boolean; marble: any }>('/stock/remove', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Marbles API - for creating marble types (not stock)
export const marblesAPI = {
  create: (data: {
    marbleType: string;
    notes?: string;
    shades: Array<{
      shade: string;
      costPrice: number;
      salePrice: number;
    }>;
  }) => apiRequest<{ success: boolean; marbles: any[] }>('/marbles/create', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Inventory APIs
export const inventoryAPI = {
  getAll: (search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    const query = params.toString();
    return apiRequest<{ success: boolean; marbles: any[] }>(`/inventory${query ? `?${query}` : ''}`);
  },

  getByBarcode: (barcode: string) => {
    return apiRequest<{ success: boolean; marble: any }>(`/inventory/barcode?barcode=${encodeURIComponent(barcode)}`);
  },

  getDetailsByType: (marbleType: string) => {
    return apiRequest<{ success: boolean; batches: any[] }>(
      `/inventory/details?marbleType=${encodeURIComponent(marbleType)}`
    );
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

  getMarbleTypes: () =>
    apiRequest<{
      success: boolean;
      marbleTypes: Array<{
        marbleType: string;
        shades: string[];
      }>;
    }>('/inventory/marble-types'),
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

  // Profile APIs for current user
  getProfile: (username: string) =>
    apiRequest<{ success: boolean; user: any }>(`/users/profile?username=${encodeURIComponent(username)}`),

  updateProfile: (username: string, data: {
    fullName?: string;
    email?: string;
    phone?: string;
    role?: string;
    department?: string;
  }) =>
    apiRequest<{ success: boolean; user: any }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ username, ...data }),
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

  changePassword: (username: string, currentPassword: string, newPassword: string) =>
    apiRequest<{ success: boolean; message: string }>('/users/change-password', {
      method: 'POST',
      body: JSON.stringify({ username, currentPassword, newPassword }),
    }),
};

// Transactions API
export const transactionsAPI = {
  getAll: (filters?: {
    search?: string;
    type?: 'IN' | 'OUT' | 'all';
    marbleType?: string;
    requestedBy?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters?.marbleType && filters.marbleType !== 'all') params.append('marbleType', filters.marbleType);
    if (filters?.requestedBy && filters.requestedBy !== 'all') params.append('requestedBy', filters.requestedBy);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const query = params.toString();
    return apiRequest<{
      success: boolean;
      transactions: any[];
      filters: {
        marbleTypes: string[];
        users: string[];
      };
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
      stats?: {
        totalAdded: number;
        totalRemoved: number;
      };
    }>(`/transactions${query ? `?${query}` : ''}`);
  },
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

// Backup API
export const backupAPI = {
  export: async () => {
    const response = await fetch('/api/backup/export');
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    return blob;
  },

  restore: (file: File) => {
    return new Promise<{ success: boolean; message: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backup = JSON.parse(e.target?.result as string);
          const result = await backupAPI.restoreFromData(backup);
          resolve(result);
        } catch (error: any) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read backup file'));
      reader.readAsText(file);
    });
  },

  restoreFromData: async (backup: any) => {
    const response = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backup),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },
};

