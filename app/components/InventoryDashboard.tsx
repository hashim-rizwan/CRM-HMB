'use client'

import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
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

const mockInventory: InventoryItem[] = [
  { id: '001', marbleType: 'Carrara', color: 'White', quantity: 2450, unit: 'kg', location: 'A-01', costPrice: 85, salePrice: 120, status: 'In Stock', lastUpdated: '2026-01-08' },
  { id: '002', marbleType: 'Calacatta', color: 'White/Gold', quantity: 850, unit: 'kg', location: 'A-02', costPrice: 150, salePrice: 210, status: 'In Stock', lastUpdated: '2026-01-07' },
  { id: '003', marbleType: 'Emperador', color: 'Brown', quantity: 320, unit: 'kg', location: 'B-01', costPrice: 95, salePrice: 135, status: 'Low Stock', lastUpdated: '2026-01-08' },
  { id: '004', marbleType: 'Nero Marquina', color: 'Black', quantity: 1680, unit: 'kg', location: 'B-02', costPrice: 110, salePrice: 160, status: 'In Stock', lastUpdated: '2026-01-06' },
  { id: '005', marbleType: 'Crema Marfil', color: 'Beige', quantity: 150, unit: 'kg', location: 'C-01', costPrice: 75, salePrice: 110, status: 'Low Stock', lastUpdated: '2026-01-08' },
  { id: '006', marbleType: 'Rosso Verona', color: 'Red', quantity: 920, unit: 'kg', location: 'C-02', costPrice: 120, salePrice: 175, status: 'In Stock', lastUpdated: '2026-01-05' },
  { id: '007', marbleType: 'Verde Guatemala', color: 'Green', quantity: 0, unit: 'kg', location: 'D-01', costPrice: 140, salePrice: 200, status: 'Out of Stock', lastUpdated: '2026-01-03' },
  { id: '008', marbleType: 'Statuario', color: 'White/Grey', quantity: 1200, unit: 'kg', location: 'D-02', costPrice: 180, salePrice: 260, status: 'In Stock', lastUpdated: '2026-01-08' },
];

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

  useEffect(() => {
    fetchInventory();
    fetchStats();
  }, [searchQuery]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getAll(searchQuery);
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

  const fetchStats = async () => {
    try {
      const response = await inventoryAPI.getStats();
      setStats(response.stats);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  };

  // Filter inventory based on search query (client-side fallback)
  const filteredInventory = elasticSearch(inventory, searchQuery);
  
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
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-[#1F2937] dark:text-white">Current Inventory</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Marble Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Color</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cost Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sale Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Updated</th>
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

