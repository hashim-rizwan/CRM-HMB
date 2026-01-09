'use client'

import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, CheckCircle, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { inventoryAPI } from '@/lib/api';

interface InventoryItem {
  id: string;
  marbleType: string;
  color: string;
  quantity: number;
  unit: string;
  location: string;
  costPrice: number;
  salePrice: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}


interface InventoryDashboardProps {
  searchQuery?: string;
}

// Elastic search function - searches across multiple fields
const elasticSearch = (items: InventoryItem[], query: string): InventoryItem[] => {
  if (!query.trim()) {
    return items;
  }

  const searchTerm = query.toLowerCase().trim();
  
  return items.filter((item) => {
    // Search across multiple fields
    const searchableFields = [
      item.id,
      item.marbleType,
      item.color,
      item.location,
      item.status,
      item.unit,
      item.costPrice.toString(),
      item.salePrice.toString(),
      item.quantity.toString(),
      item.lastUpdated,
    ];

    // Check if any field contains the search term (case-insensitive)
    return searchableFields.some((field) => 
      field.toLowerCase().includes(searchTerm)
    );
  });
};

export function InventoryDashboard({ searchQuery = '' }: InventoryDashboardProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalQuantity: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalInventoryValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [hideOutOfStock, setHideOutOfStock] = useState<boolean>(false);

  useEffect(() => {
    fetchInventory();
    fetchStats();
  }, [searchQuery, sortBy, sortOrder]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getAll(searchQuery, sortBy, sortOrder);
      // Transform API data to match InventoryItem interface
      const transformed = response.marbles.map((marble: any) => ({
        id: marble.id.toString(),
        marbleType: marble.marbleType,
        color: marble.color,
        quantity: marble.quantity,
        unit: marble.unit,
        location: marble.location,
        costPrice: marble.costPrice || 0,
        salePrice: marble.salePrice || 0,
        status: marble.status as 'In Stock' | 'Low Stock' | 'Out of Stock',
        lastUpdated: new Date(marble.updatedAt).toLocaleDateString(),
      }));
      setInventory(transformed);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory');
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return null;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 inline-block ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 inline-block ml-1" />
    );
  };

  const fetchStats = async () => {
    try {
      const response = await inventoryAPI.getStats();
      setStats(response.stats);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  };

  // Filter inventory based on search query (client-side fallback)
  let filteredInventory = elasticSearch(inventory, searchQuery);
  
  // Filter out "Out of Stock" items if hideOutOfStock is true
  if (hideOutOfStock) {
    filteredInventory = filteredInventory.filter(item => item.status !== 'Out of Stock');
  }
  
  const totalItems = stats.totalItems || filteredInventory.length;
  const totalQuantity = stats.totalQuantity || filteredInventory.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = stats.lowStockCount || filteredInventory.filter(item => item.status === 'Low Stock').length;
  const outOfStockCount = stats.outOfStockCount || filteredInventory.filter(item => item.status === 'Out of Stock').length;
  const totalInventoryValue = stats.totalInventoryValue || filteredInventory.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
  const potentialRevenue = filteredInventory.reduce((sum, item) => sum + (item.quantity * item.salePrice), 0);

  const summaryCards = [
    { title: 'Total Items', value: totalItems, icon: Package, color: 'bg-[#2563EB]', change: '+2 this week' },
    { title: 'Total Stock', value: `${totalQuantity.toLocaleString()} kg`, icon: TrendingUp, color: 'bg-[#16A34A]', change: '+5% from last month' },
    { title: 'Inventory Value', value: `PKR ${totalInventoryValue.toLocaleString()}`, icon: Package, color: 'bg-[#7C3AED]', change: 'At cost price' },
    { title: 'Low Stock', value: lowStockCount, icon: AlertTriangle, color: 'bg-[#F59E0B]', change: 'Needs attention' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-[#16A34A] text-white';
      case 'Low Stock': return 'bg-[#F59E0B] text-white';
      case 'Out of Stock': return 'bg-[#DC2626] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="p-8 pt-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">{card.title}</h3>
              <p className="text-3xl font-semibold text-[#1F2937] dark:text-white mb-2">{card.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{card.change}</p>
            </div>
          );
        })}
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#1F2937] dark:text-white">Current Inventory</h3>
          <button
            onClick={() => setHideOutOfStock(!hideOutOfStock)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hideOutOfStock
                ? 'bg-[#DC2626] dark:bg-red-600 text-white hover:bg-[#B91C1C] dark:hover:bg-red-700'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {hideOutOfStock ? (
              <>
                <EyeOff className="w-4 h-4" />
                Show Out of Stock
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Hide Out of Stock
              </>
            )}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('id')}
                >
                  ID {getSortIcon('id')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('marbleType')}
                >
                  Marble Type {getSortIcon('marbleType')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('color')}
                >
                  Color {getSortIcon('color')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('quantity')}
                >
                  Quantity {getSortIcon('quantity')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('costPrice')}
                >
                  Cost Price {getSortIcon('costPrice')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('salePrice')}
                >
                  Sale Price {getSortIcon('salePrice')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('location')}
                >
                  Location {getSortIcon('location')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  Status {getSortIcon('status')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('updatedAt')}
                >
                  Last Updated {getSortIcon('updatedAt')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No inventory items found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1F2937] dark:text-white">{item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.marbleType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{item.color}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.quantity.toLocaleString()} {item.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{`PKR ${item.costPrice}/${item.unit}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#16A34A] dark:text-green-400">{`PKR ${item.salePrice}/${item.unit}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{item.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.lastUpdated}</td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

