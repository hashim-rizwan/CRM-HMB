'use client'

import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, Eye, EyeOff, ChevronDown, ChevronRight, Ruler } from 'lucide-react';
import { inventoryAPI } from '@/lib/api';

interface SlabEntry {
  id: number;
  quantity: number;
  unit: string | null;
  slabInfo: { length: number; width: number; numberOfSlabs: number } | null;
  notes: string | null;
}

interface ShadeData {
  shade: string;
  costPrice: number | null;
  salePrice: number | null;
  totalQuantity: number;
  shadeStatus: string;
  lastUpdated: string;
  entries: SlabEntry[];
}

interface MarbleType {
  id: number;
  marbleType: string;
  availableShades: string[];
  totalQuantity: number;
  overallStatus: string;
  lastUpdated: string;
  shades: ShadeData[];
}

interface InventoryDashboardProps {
  searchQuery?: string;
  userRole?: 'Admin' | 'Staff';
}

export function InventoryDashboard({ searchQuery = '', userRole = 'Staff' }: InventoryDashboardProps) {
  const [marbleTypes, setMarbleTypes] = useState<MarbleType[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalQuantity: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalInventoryValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hideOutOfStock, setHideOutOfStock] = useState<boolean>(false);
  const [expandedMarbleTypes, setExpandedMarbleTypes] = useState<Set<string>>(new Set());
  const [expandedShades, setExpandedShades] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchInventory();
    fetchStats();
  }, [searchQuery]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.getGrouped(searchQuery);
      setMarbleTypes(response.marbleTypes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory');
      console.error('Error fetching inventory:', err);
      setMarbleTypes([]);
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

  const handleMarbleTypeClick = (marbleType: string) => {
    const newExpanded = new Set(expandedMarbleTypes);
    if (newExpanded.has(marbleType)) {
      newExpanded.delete(marbleType);
      // Also collapse all shades for this marble type
      const newExpandedShades = new Set(expandedShades);
      marbleTypes.find(mt => mt.marbleType === marbleType)?.shades.forEach(shade => {
        newExpandedShades.delete(`${marbleType}__${shade.shade}`);
      });
      setExpandedShades(newExpandedShades);
    } else {
      newExpanded.add(marbleType);
    }
    setExpandedMarbleTypes(newExpanded);
  };

  const handleShadeClick = (marbleType: string, shade: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = `${marbleType}__${shade}`;
    const newExpanded = new Set(expandedShades);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedShades(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-[#16A34A] text-white';
      case 'Low Stock': return 'bg-[#F59E0B] text-white';
      case 'Out of Stock': return 'bg-[#DC2626] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Filter out of stock items if needed
  let filteredMarbleTypes = marbleTypes;
  if (hideOutOfStock) {
    filteredMarbleTypes = marbleTypes.filter(mt => mt.overallStatus !== 'Out of Stock');
  }

  // Calculate stats from filtered data
  const totalItems = filteredMarbleTypes.length;
  const totalQuantity = filteredMarbleTypes.reduce((sum, mt) => sum + mt.totalQuantity, 0);
  const lowStockCount = filteredMarbleTypes.filter(mt => mt.overallStatus === 'Low Stock').length;
  const outOfStockCount = filteredMarbleTypes.filter(mt => mt.overallStatus === 'Out of Stock').length;
  const totalInventoryValue = filteredMarbleTypes.reduce((sum, mt) => {
    return sum + mt.shades.reduce((shadeSum, shade) => {
      return shadeSum + shade.entries.reduce((entrySum, entry) => {
        return entrySum + (entry.quantity * (shade.costPrice || 0));
      }, 0);
    }, 0);
  }, 0);

  const summaryCards = [
    { title: 'Total Marble Types', value: totalItems, icon: Package, color: 'bg-[#2563EB]', change: `${filteredMarbleTypes.reduce((sum, mt) => sum + mt.shades.length, 0)} total shades` },
    { title: 'Total Stock', value: `${totalQuantity.toLocaleString()} sq ft`, icon: TrendingUp, color: 'bg-[#16A34A]', change: 'Across all shades' },
    ...(userRole === 'Admin' ? [{ title: 'Inventory Value', value: `PKR ${totalInventoryValue.toLocaleString()}`, icon: Package, color: 'bg-[#7C3AED]', change: 'At cost price' }] : []),
    { title: 'Low Stock', value: lowStockCount, icon: AlertTriangle, color: 'bg-[#F59E0B]', change: 'Needs attention' },
  ];

  if (loading) {
    return (
      <div className="p-8 pt-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading inventory...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 pt-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

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
          {filteredMarbleTypes.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? (
                <>No marble types found matching "{searchQuery}"</>
              ) : (
                <>No inventory items found</>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredMarbleTypes.map((marbleType) => {
                const isMarbleExpanded = expandedMarbleTypes.has(marbleType.marbleType);
                const lastUpdatedDate = new Date(marbleType.lastUpdated).toLocaleDateString();
                
                return (
                  <div key={marbleType.id} className="transition-colors">
                    {/* Level 1: Marble Type Table */}
                    <div className="px-6 py-4">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-8"></th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Marble Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Available Shades</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Quantity</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                            onClick={() => handleMarbleTypeClick(marbleType.marbleType)}
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              {isMarbleExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[#1F2937] dark:text-white">
                              {marbleType.id}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {marbleType.marbleType}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {marbleType.availableShades.join(', ')}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {marbleType.totalQuantity.toLocaleString()} sq ft
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(marbleType.overallStatus)}`}>
                                {marbleType.overallStatus}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {lastUpdatedDate}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Level 2: Shades Table (when marble type is expanded) */}
                    {isMarbleExpanded && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="pl-8 space-y-4">
                          {marbleType.shades.map((shade) => {
                            const shadeKey = `${marbleType.marbleType}__${shade.shade}`;
                            const isShadeExpanded = expandedShades.has(shadeKey);
                            const shadeLastUpdated = new Date(shade.lastUpdated).toLocaleDateString();
                            
                            return (
                              <div key={shadeKey} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <table className="w-full">
                                  <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider w-8"></th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Shade</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Total Quantity</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                      {userRole === 'Admin' && (
                                        <>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Cost Price</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Sale Price</th>
                                        </>
                                      )}
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Last Updated</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr
                                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                      onClick={(e) => handleShadeClick(marbleType.marbleType, shade.shade, e)}
                                    >
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        {isShadeExpanded ? (
                                          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        )}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {shade.shade}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                        {shade.totalQuantity.toLocaleString()} sq ft
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shade.shadeStatus)}`}>
                                          {shade.shadeStatus}
                                        </span>
                                      </td>
                                      {userRole === 'Admin' && (
                                        <>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {shade.costPrice != null ? `PKR ${shade.costPrice.toLocaleString()}/sq ft` : 'N/A'}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#16A34A] dark:text-green-400">
                                            {shade.salePrice != null ? `PKR ${shade.salePrice.toLocaleString()}/sq ft` : 'N/A'}
                                          </td>
                                        </>
                                      )}
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {shadeLastUpdated}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>

                                {/* Level 3: Slab Entries Table (when shade is expanded) */}
                                {isShadeExpanded && (
                                  <div className="bg-gray-50 dark:bg-gray-800/50 px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="pt-4">
                                      <table className="w-full">
                                        <thead className="bg-gray-100 dark:bg-gray-700">
                                          <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Dimensions</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Number of Slabs</th>
                                          </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                          {shade.entries.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {entry.quantity.toLocaleString()} {entry.unit || 'sq ft'}
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {entry.slabInfo ? (
                                                  <span>
                                                    {entry.slabInfo.length} × {entry.slabInfo.width} ft
                                                  </span>
                                                ) : (
                                                  <span className="text-gray-400 dark:text-gray-500">Not specified</span>
                                                )}
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {entry.slabInfo && entry.slabInfo.numberOfSlabs > 0 ? (
                                                  <span>
                                                    {entry.slabInfo.numberOfSlabs} {entry.slabInfo.numberOfSlabs === 1 ? 'slab' : 'slabs'}
                                                  </span>
                                                ) : (
                                                  <span className="text-gray-400 dark:text-gray-500">-</span>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
