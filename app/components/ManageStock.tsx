'use client'

import { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, Save, Trash2, Scan, Barcode, Package } from 'lucide-react';
import { stockAPI, inventoryAPI, marblesAPI } from '@/lib/api';

interface ManageStockProps {
  searchQuery?: string;
  userRole?: 'Admin' | 'Staff';
}

export function ManageStock({ searchQuery = '', userRole = 'Staff' }: ManageStockProps) {
  const [activeTab, setActiveTab] = useState<'add' | 'new-item' | 'remove'>('add');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  
  const [addFormData, setAddFormData] = useState({
    marbleType: '',
    quantity: '',
    unit: 'square feet',
    location: '',
    supplier: '',
    batchNumber: '',
    costPrice: '',
    salePrice: '',
    notes: '',
  });

  const [removeFormData, setRemoveFormData] = useState({
    marbleType: '',
    quantity: '',
    reason: '',
    requestedBy: '',
    notes: '',
  });

  const [newItemFormData, setNewItemFormData] = useState({
    marbleType: '',
    supplier: '',
    batchNumber: '',
    costPrice: '',
    salePrice: '',
    notes: '',
  });
  const [generatedBarcode, setGeneratedBarcode] = useState<string>('');

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await stockAPI.add({
        marbleType: addFormData.marbleType,
        color: '', // Color will be derived from marble type in API
        quantity: parseFloat(addFormData.quantity),
        unit: addFormData.unit,
        location: addFormData.location,
        supplier: addFormData.supplier || undefined,
        batchNumber: addFormData.batchNumber || undefined, // API will auto-generate if not provided
        costPrice: addFormData.costPrice ? parseFloat(addFormData.costPrice) : undefined,
        salePrice: addFormData.salePrice ? parseFloat(addFormData.salePrice) : undefined,
        notes: addFormData.notes || undefined,
        barcode: scannedBarcode || undefined,
      });

      // Update batch number from API response if provided
      const finalBatchNumber = response.batchNumber || addFormData.batchNumber;

      setAddFormData({
        marbleType: '',
        quantity: '',
        unit: 'square feet',
        location: '',
        supplier: '',
        batchNumber: '',
        costPrice: '',
        salePrice: '',
        notes: '',
      });
      setScannedBarcode('');
      
      // Refresh inventory data after adding stock
      const inventoryResponse = await inventoryAPI.getAll();
      setInventory(inventoryResponse.marbles || []);
      
      setSuccessMessage(`Stock added successfully!${finalBatchNumber ? ` Batch: ${finalBatchNumber}` : ''}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await stockAPI.remove({
        marbleType: removeFormData.marbleType,
        quantity: parseFloat(removeFormData.quantity),
        reason: removeFormData.reason,
        requestedBy: removeFormData.requestedBy || undefined,
        notes: removeFormData.notes || undefined,
      });

      setRemoveFormData({
        marbleType: '',
        quantity: '',
        reason: '',
        requestedBy: '',
        notes: '',
      });
      
      // Refresh inventory data after removing stock
      const response = await inventoryAPI.getAll();
      setInventory(response.marbles || []);
      
      setSuccessMessage('Stock removed successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove stock');
    } finally {
      setLoading(false);
    }
  };

  // Generate batch number based on marble type
  const generateBatchNumber = (marbleType: string): string => {
    if (!marbleType || marbleType.trim() === '') return '';
    
    // Get count of existing batches for this marble type
    const existingBatches = inventory.filter(
      (marble: any) => 
        marble.marbleType === marbleType && 
        marble.batchNumber && 
        marble.batchNumber.trim() !== ''
    );
    
    const prefix = marbleType
      .replace(/\s+/g, '')
      .toUpperCase()
      .slice(0, 4) || 'HMB';
    
    return `${prefix}-B${existingBatches.length + 1}`;
  };

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const newData = {
      ...addFormData,
      [e.target.name]: e.target.value,
    };
    
    // Auto-generate batch number when marble type changes
    if (e.target.name === 'marbleType' && e.target.value.trim() !== '') {
      newData.batchNumber = generateBatchNumber(e.target.value);
    }
    
    setAddFormData(newData);
  };

  const handleRemoveChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setRemoveFormData({
      ...removeFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setNewItemFormData({
      ...newItemFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNewItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await marblesAPI.create({
        marbleType: newItemFormData.marbleType,
        supplier: newItemFormData.supplier || undefined,
        batchNumber: newItemFormData.batchNumber || undefined,
        costPrice: newItemFormData.costPrice ? parseFloat(newItemFormData.costPrice) : undefined,
        salePrice: newItemFormData.salePrice ? parseFloat(newItemFormData.salePrice) : undefined,
        notes: newItemFormData.notes || undefined,
      });
      
      // Store the generated barcode from response
      if (response.marble?.barcode) {
        setGeneratedBarcode(response.marble.barcode);
        setSuccessMessage(`New marble type created successfully! Barcode: ${response.marble.barcode}. You can now use "Add Stock" to add inventory for this marble type.`);
      } else {
        setSuccessMessage('New marble type created successfully!');
      }

      setNewItemFormData({
        marbleType: '',
        supplier: '',
        batchNumber: '',
        costPrice: '',
        salePrice: '',
        notes: '',
      });
      
      // Refresh inventory data after adding new item
      const inventoryResponse = await inventoryAPI.getAll();
      setInventory(inventoryResponse.marbles || []);
      
      setTimeout(() => setSuccessMessage(null), 8000);
    } catch (err: any) {
      setError(err.message || 'Failed to create marble type');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique marble types and locations from inventory data
  const marbleTypes = useMemo(() => {
    const types = new Set<string>();
    inventory.forEach((marble: any) => {
      if (marble.marbleType) {
        types.add(marble.marbleType);
      }
    });
    return Array.from(types).sort();
  }, [inventory]);

  const locations = useMemo(() => {
    const locs = new Set<string>();
    inventory.forEach((marble: any) => {
      if (marble.location) {
        locs.add(marble.location);
      }
    });
    // Add default locations if none exist
    const defaultLocations = ['A-01', 'A-02', 'B-01', 'B-02', 'C-01', 'C-02', 'D-01', 'D-02', 'E-01', 'E-02'];
    defaultLocations.forEach(loc => locs.add(loc));
    return Array.from(locs).sort();
  }, [inventory]);

  // Fetch inventory data from API
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await inventoryAPI.getAll();
        setInventory(response.marbles || []);
      } catch (err) {
        console.error('Error fetching inventory:', err);
        // Fallback to empty array if API fails
        setInventory([]);
      }
    };
    fetchInventory();
  }, []);

  // Calculate available stock by marble type from real inventory data
  const availableStock = useMemo(() => {
    const stockMap = new Map<string, { available: number; unit: string }>();
    
    inventory.forEach((marble: any) => {
      const key = marble.marbleType;
      if (stockMap.has(key)) {
        const existing = stockMap.get(key)!;
        stockMap.set(key, {
          available: existing.available + marble.quantity,
          unit: existing.unit, // Use first unit found for each type
        });
      } else {
        stockMap.set(key, {
          available: marble.quantity,
          unit: marble.unit || 'square feet',
        });
      }
    });

    return Array.from(stockMap.entries()).map(([type, data]) => ({
      type,
      ...data,
    }));
  }, [inventory]);

  const reasons = [
    'Production Use',
    'Customer Order',
    'Quality Issue',
    'Damage/Breakage',
    'Sample/Testing',
    'Transfer to Another Location',
    'Other',
  ];

  // Filter marble types based on search query
  const filteredMarbleTypes = searchQuery
    ? marbleTypes.filter(type => type.toLowerCase().includes(searchQuery.toLowerCase()))
    : marbleTypes;

  // Filter available stock based on search query
  const filteredAvailableStock = searchQuery
    ? availableStock.filter(stock => 
        stock.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.available.toString().includes(searchQuery) ||
        stock.unit.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableStock;

  const selectedStock = availableStock.find(s => s.type === removeFormData.marbleType);

  const handleScanBarcode = () => {
    setShowBarcodeScanner(true);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setScannedBarcode(barcode);
    setShowBarcodeScanner(false);
    
    try {
      // Fetch marble data by barcode
      const response = await inventoryAPI.getByBarcode(barcode);
      
      if (response.marble) {
        const marble = response.marble;
        
        if (activeTab === 'add') {
          // Auto-populate Add Stock form
          const newBatchNumber = generateBatchNumber(marble.marbleType);
          setAddFormData({
            ...addFormData,
            marbleType: marble.marbleType,
            unit: marble.unit,
            location: marble.location,
            supplier: marble.supplier || '',
            batchNumber: newBatchNumber, // Auto-generate new batch number
            costPrice: marble.costPrice?.toString() || '',
            salePrice: marble.salePrice?.toString() || '',
          });
          setSuccessMessage(`Barcode scanned: ${barcode}. Marble: ${marble.marbleType} - ${marble.color}`);
          setTimeout(() => setSuccessMessage(null), 5000);
        } else if (activeTab === 'remove') {
          // Auto-populate Remove Stock form
          setRemoveFormData({
            ...removeFormData,
            marbleType: marble.marbleType,
          });
          setSuccessMessage(`Barcode scanned: ${barcode}. Marble: ${marble.marbleType} - ${marble.color}`);
          setTimeout(() => setSuccessMessage(null), 5000);
        }
      } else {
        setError(`Barcode ${barcode} not found in database`);
      }
    } catch (error: any) {
      console.error('Error fetching marble by barcode:', error);
      setError(`Error: ${error.message || 'Failed to fetch marble data'}`);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Notifications */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-4 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
            >
              ✕
            </button>
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header with Tabs */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-[#1F2937] dark:text-white mb-4">Manage Stock</h3>
          
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('add')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'add'
                  ? 'text-[#16A34A]'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Stock
              </div>
              {activeTab === 'add' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#16A34A]"></div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('remove')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'remove'
                  ? 'text-[#DC2626]'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Minus className="w-5 h-5" />
                Remove Stock
              </div>
              {activeTab === 'remove' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#DC2626]"></div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('new-item')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'new-item'
                  ? 'text-[#2563EB]'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Add New Item
              </div>
              {activeTab === 'new-item' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB]"></div>
              )}
            </button>
          </div>
        </div>

        {/* Add New Item Form */}
        {activeTab === 'new-item' && (
          <form onSubmit={handleNewItemSubmit} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-[#1F2937] dark:text-white mb-2">Add New Marble Type</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create a new marble type with generic information. Stock can be added later using "Add Stock".</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Marble Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Marble Type <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  name="marbleType"
                  value={newItemFormData.marbleType}
                  onChange={handleNewItemChange}
                  required
                  placeholder="e.g., Travertine, Onyx, Granite"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supplier
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={newItemFormData.supplier}
                  onChange={handleNewItemChange}
                  placeholder="Supplier name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Batch Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Batch Number
                </label>
                <input
                  type="text"
                  name="batchNumber"
                  value={newItemFormData.batchNumber}
                  onChange={handleNewItemChange}
                  placeholder="e.g., BATCH-2026-001"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Cost Price - Admin only */}
              {userRole === 'Admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cost Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                    PKR
                  </span>
                  <input
                    type="number"
                    name="costPrice"
                    value={newItemFormData.costPrice}
                    onChange={handleNewItemChange}
                    placeholder="e.g., 100.00"
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
              )}

              {/* Sale Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sale Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                    PKR
                  </span>
                  <input
                    type="number"
                    name="salePrice"
                    value={newItemFormData.salePrice}
                    onChange={handleNewItemChange}
                    placeholder="e.g., 150.00"
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={newItemFormData.notes}
                onChange={handleNewItemChange}
                rows={4}
                placeholder="Additional notes or comments..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-y"
              />
            </div>

            {/* Generated Barcode Display */}
            {generatedBarcode && (
              <div className="mb-6">
                <div className="bg-[#D1FAE5] dark:bg-green-900 border border-[#16A34A] dark:border-green-700 rounded-lg p-4">
                  <p className="text-sm font-medium text-[#065F46] dark:text-green-300 mb-1">
                    ✓ Barcode Generated Successfully
                  </p>
                  <p className="text-lg font-semibold text-[#065F46] dark:text-green-200">
                    {generatedBarcode}
                  </p>
                  <p className="text-xs text-[#065F46] dark:text-green-400 mt-1">
                    This barcode can be scanned to quickly add or remove stock for this marble type
                  </p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                 onClick={() => {
                   setNewItemFormData({
                     marbleType: '',
                     supplier: '',
                     batchNumber: '',
                     costPrice: '',
                     salePrice: '',
                     notes: '',
                   });
                   setGeneratedBarcode('');
                 }}
                className="px-6 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#2563EB] dark:bg-blue-600 text-white rounded-lg hover:bg-[#1E40AF] dark:hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-200 dark:disabled:text-gray-400"
              >
                <Package className="w-4 h-4" />
                {loading ? 'Adding...' : 'Add New Item'}
              </button>
            </div>
          </form>
        )}

        {/* Add Stock Form */}
        {activeTab === 'add' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <form onSubmit={handleAddSubmit} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
            {/* Barcode Scanner Button */}
            <div className="mb-6 flex justify-end">
              <button
                type="button"
                onClick={handleScanBarcode}
                className="px-4 py-2 bg-[#2563EB] dark:bg-blue-600 text-white rounded-lg hover:bg-[#1E40AF] dark:hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Scan className="w-4 h-4" />
                Scan Barcode
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Marble Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Marble Type <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="marbleType"
                    value={addFormData.marbleType}
                    onChange={handleAddChange}
                    list="marbleTypesList"
                    required
                    placeholder="Type or select marble type"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                  />
                  <datalist id="marbleTypesList">
                    {filteredMarbleTypes.map((type) => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Type a new marble type or select from existing ones
                </p>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={addFormData.quantity}
                  onChange={handleAddChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Unit <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  name="unit"
                  value={addFormData.unit}
                  onChange={handleAddChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                >
                  <option value="square feet">Square Feet (sq ft)</option>
                  <option value="sqm">Square Meters (m²)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="ton">Tons</option>
                  <option value="pcs">Pieces</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Storage Location <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  name="location"
                  value={addFormData.location}
                  onChange={handleAddChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select location</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supplier
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={addFormData.supplier}
                  onChange={handleAddChange}
                  placeholder="Supplier name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Batch Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Batch Number <span className="text-xs text-gray-500 dark:text-gray-400">(Auto-generated)</span>
                </label>
                <input
                  type="text"
                  name="batchNumber"
                  value={addFormData.batchNumber}
                  readOnly
                  disabled
                  placeholder="Will be auto-generated"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Batch number is automatically generated when you select a marble type
                </p>
              </div>

              {/* Cost Price - Admin only */}
              {userRole === 'Admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cost Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                    PKR
                  </span>
                  <input
                    type="number"
                    name="costPrice"
                    value={addFormData.costPrice}
                    onChange={handleAddChange}
                    placeholder="e.g., 100.00"
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
              )}

              {/* Sale Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sale Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                    PKR
                  </span>
                  <input
                    type="number"
                    name="salePrice"
                    value={addFormData.salePrice}
                    onChange={handleAddChange}
                    placeholder="e.g., 150.00"
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={addFormData.notes}
                onChange={handleAddChange}
                rows={4}
                placeholder="Additional notes or comments..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-y"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                 onClick={() => setAddFormData({
                   marbleType: '',
                   quantity: '',
                  unit: 'square feet',
                  location: '',
                  supplier: '',
                  batchNumber: '',
                  costPrice: '',
                  salePrice: '',
                  notes: '',
                })}
                className="px-6 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#16A34A] dark:bg-green-600 text-white rounded-lg hover:bg-[#15803D] dark:hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-200 dark:disabled:text-gray-400"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Adding...' : 'Add Stock'}
              </button>
            </div>
          </form>
            </div>

            {/* Summary Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 sticky top-8">
                <h4 className="font-semibold text-[#1F2937] dark:text-white mb-4">Quick Summary</h4>
                
                <div className="space-y-4">
                  <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Selected Item</p>
                     <p className="font-medium text-[#1F2937] dark:text-white">
                       {addFormData.marbleType || 'None selected'}
                     </p>
                  </div>

                  <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Stock</p>
                    <p className="font-medium text-[#1F2937] dark:text-white">
                      {(() => {
                        const currentStock = availableStock.find(s => s.type === addFormData.marbleType);
                        return currentStock 
                          ? `${currentStock.available.toLocaleString()} ${currentStock.unit}`
                          : '-';
                      })()}
                    </p>
                  </div>

                  <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Adding</p>
                    <p className="font-medium text-[#16A34A] dark:text-green-400">
                      {addFormData.quantity 
                        ? `${parseFloat(addFormData.quantity).toLocaleString()} ${addFormData.unit || 'square feet'}`
                        : '-'
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">New Total</p>
                    <p className="font-semibold text-[#1F2937] dark:text-white">
                      {(() => {
                        const currentStock = availableStock.find(s => s.type === addFormData.marbleType);
                        if (currentStock && addFormData.quantity) {
                          const newTotal = currentStock.available + parseFloat(addFormData.quantity);
                          return `${newTotal.toLocaleString()} ${currentStock.unit}`;
                        }
                        return '-';
                      })()}
                    </p>
                  </div>
                </div>

                {addFormData.marbleType && addFormData.quantity && (() => {
                  const currentStock = availableStock.find(s => s.type === addFormData.marbleType);
                  if (currentStock) {
                    const newTotal = currentStock.available + parseFloat(addFormData.quantity);
                    if (newTotal > 10000) {
                      return (
                        <div className="mt-4 p-3 bg-[#D1FAE5] dark:bg-green-900 border border-[#16A34A] dark:border-green-700 rounded-lg">
                          <p className="text-xs text-[#065F46] dark:text-green-300">
                            ✓ Stock level will exceed 10,000 {currentStock.unit}
                          </p>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Remove Stock Form */}
        {activeTab === 'remove' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <form onSubmit={handleRemoveSubmit} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
                <div className="space-y-6 mb-6">
                  {/* Marble Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Marble Type <span className="text-[#DC2626]">*</span>
                    </label>
                    <select
                      name="marbleType"
                      value={removeFormData.marbleType}
                      onChange={handleRemoveChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select marble type</option>
                      {filteredAvailableStock.map((stock) => (
                        <option key={stock.type} value={stock.type}>
                          {stock.type} - Available: {stock.available.toLocaleString()} {stock.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quantity to Remove <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="quantity"
                        value={removeFormData.quantity}
                        onChange={handleRemoveChange}
                        required
                        min="0"
                        max={selectedStock?.available || undefined}
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                        {selectedStock?.unit || 'square feet'}
                      </span>
                    </div>
                    {selectedStock && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Maximum available: {selectedStock.available.toLocaleString()} {selectedStock.unit}
                      </p>
                    )}
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reason for Removal <span className="text-[#DC2626]">*</span>
                    </label>
                    <select
                      name="reason"
                      value={removeFormData.reason}
                      onChange={handleRemoveChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select reason</option>
                      {reasons.map((reason) => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                  </div>

                  {/* Requested By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Requested By
                    </label>
                    <input
                      type="text"
                      name="requestedBy"
                      value={removeFormData.requestedBy}
                      onChange={handleRemoveChange}
                      placeholder="Name or department"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={removeFormData.notes}
                      onChange={handleRemoveChange}
                      rows={4}
                      placeholder="Additional details..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setRemoveFormData({
                      marbleType: '',
                      quantity: '',
                      reason: '',
                      requestedBy: '',
                      notes: '',
                    })}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-[#DC2626] dark:bg-red-600 text-white rounded-lg hover:bg-[#B91C1C] dark:hover:bg-red-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-200 dark:disabled:text-gray-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    {loading ? 'Removing...' : 'Remove Stock'}
                  </button>
                </div>
              </form>
            </div>

            {/* Summary Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 sticky top-8">
                <h4 className="font-semibold text-[#1F2937] dark:text-white mb-4">Quick Summary</h4>
                
                <div className="space-y-4">
                  <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Selected Item</p>
                    <p className="font-medium text-[#1F2937] dark:text-white">
                      {removeFormData.marbleType || 'None selected'}
                    </p>
                  </div>

                  <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Available Stock</p>
                    <p className="font-medium text-[#1F2937] dark:text-white">
                      {selectedStock 
                        ? `${selectedStock.available.toLocaleString()} ${selectedStock.unit}`
                        : '-'
                      }
                    </p>
                  </div>

                  <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Removing</p>
                    <p className="font-medium text-[#DC2626] dark:text-red-400">
                      {removeFormData.quantity 
                        ? `${parseFloat(removeFormData.quantity).toLocaleString()} ${selectedStock?.unit || 'square feet'}`
                        : '-'
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Remaining Stock</p>
                    <p className="font-semibold text-[#1F2937] dark:text-white">
                      {selectedStock && removeFormData.quantity
                        ? `${(selectedStock.available - parseFloat(removeFormData.quantity)).toLocaleString()} ${selectedStock.unit}`
                        : '-'
                      }
                    </p>
                  </div>
                </div>

                {selectedStock && removeFormData.quantity && (selectedStock.available - parseFloat(removeFormData.quantity)) < 500 && (
                  <div className="mt-4 p-3 bg-[#FEF3C7] dark:bg-yellow-900 border border-[#F59E0B] dark:border-yellow-700 rounded-lg">
                    <p className="text-xs text-[#92400E] dark:text-yellow-300">
                      ⚠️ Warning: Remaining stock will be below 500 {selectedStock.unit}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#1F2937] dark:text-white">Barcode Scanner</h3>
              <button
                onClick={() => setShowBarcodeScanner(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 flex flex-col items-center justify-center">
                <Barcode className="w-20 h-20 text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">Position barcode in scanner view</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 text-center">Scanner ready...</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Or enter barcode manually:
              </label>
              <input
                type="text"
                value={scannedBarcode}
                onChange={(e) => setScannedBarcode(e.target.value)}
                placeholder="Enter barcode number"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && scannedBarcode) {
                    handleBarcodeScanned(scannedBarcode);
                  }
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBarcodeScanner(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => scannedBarcode && handleBarcodeScanned(scannedBarcode)}
                disabled={!scannedBarcode}
                className="flex-1 px-4 py-2 bg-[#2563EB] dark:bg-blue-600 text-white rounded-lg hover:bg-[#1E40AF] dark:hover:bg-blue-700 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-200 dark:disabled:text-gray-400"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
