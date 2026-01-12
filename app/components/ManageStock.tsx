'use client'

import { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, Save, Trash2, Scan, Barcode, Package } from 'lucide-react';
import { stockAPI, inventoryAPI, marblesAPI } from '@/lib/api';

interface ManageStockProps {
  searchQuery?: string;
  userRole?: 'Admin' | 'Staff';
}

export function ManageStock({ searchQuery = '', userRole = 'Staff' }: ManageStockProps) {
  const [activeTab, setActiveTab] = useState<'add' | 'new-item' | 'remove' | 'reserve'>('add');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  
  const [addFormData, setAddFormData] = useState({
    marbleType: '',
    shade: '',
    slabSizeLength: '',
    slabSizeWidth: '',
    numberOfSlabs: '',
    notes: '',
  });

  const [removeFormData, setRemoveFormData] = useState({
    barcode: '',
    marbleType: '',
    shade: '',
    slabSizeLength: '',
    slabSizeWidth: '',
    numberOfSlabs: '',
    reason: '',
    notes: '',
  });
  const [scannedRemoveBarcode, setScannedRemoveBarcode] = useState<string>('');
  const [scannedReserveBarcode, setScannedReserveBarcode] = useState<string>('');
  const [marbleTypesData, setMarbleTypesData] = useState<Array<{ marbleType: string; shades: string[] }>>([]);

  const [reserveFormData, setReserveFormData] = useState({
    barcode: '',
    marbleType: '',
    shade: '',
    slabSizeLength: '',
    slabSizeWidth: '',
    numberOfSlabs: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    notes: '',
  });

  const [newItemFormData, setNewItemFormData] = useState({
    marbleType: '',
    notes: '',
    shades: {
      AA: { active: false, costPrice: '', salePrice: '' },
      A: { active: false, costPrice: '', salePrice: '' },
      B: { active: false, costPrice: '', salePrice: '' },
      'B-': { active: false, costPrice: '', salePrice: '' },
    },
  });
  const [generatedBarcode, setGeneratedBarcode] = useState<string>('');

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Calculate quantity from slab size and number of slabs
      const length = parseFloat(addFormData.slabSizeLength);
      const width = parseFloat(addFormData.slabSizeWidth);
      const numberOfSlabs = parseFloat(addFormData.numberOfSlabs);
      
      if (!length || !width || !numberOfSlabs) {
        throw new Error('Please enter valid slab size and number of slabs');
      }
      
      // Calculate total square feet: length (ft) × width (ft) × number of slabs
      const totalSquareFeet = length * width * numberOfSlabs;
      
      const response = await stockAPI.add({
        marbleType: addFormData.marbleType,
        color: addFormData.shade, // Use shade as color
        quantity: totalSquareFeet,
        unit: 'square feet',
        location: 'N/A', // Default location (will be removed from schema)
        supplier: undefined,
        batchNumber: undefined, // No batch number, using shade instead
        costPrice: undefined,
        salePrice: undefined,
        notes: addFormData.notes || `Slab Size: ${length}x${width}, Number of Slabs: ${numberOfSlabs}`,
        barcode: scannedBarcode || undefined,
      });

      setAddFormData({
        marbleType: '',
        shade: '',
        slabSizeLength: '',
        slabSizeWidth: '',
        numberOfSlabs: '',
        notes: '',
      });
      setScannedBarcode('');
      
      // Refresh inventory data after adding stock
      const inventoryResponse = await inventoryAPI.getAll();
      setInventory(inventoryResponse.marbles || []);
      
      setSuccessMessage(`Stock added successfully! Shade: ${addFormData.shade}, Total: ${totalSquareFeet.toLocaleString()} sq ft`);
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
      // Calculate quantity from slab size and number of slabs
      const length = parseFloat(removeFormData.slabSizeLength);
      const width = parseFloat(removeFormData.slabSizeWidth);
      const numberOfSlabs = parseFloat(removeFormData.numberOfSlabs);
      
      if (!length || !width || !numberOfSlabs) {
        throw new Error('Please enter valid slab size and number of slabs');
      }
      
      // Calculate total square feet: length (ft) × width (ft) × number of slabs
      const totalSquareFeet = length * width * numberOfSlabs;

      await stockAPI.remove({
        barcode: removeFormData.barcode || scannedRemoveBarcode,
        marbleType: removeFormData.marbleType,
        shade: removeFormData.shade,
        slabSizeLength: length,
        slabSizeWidth: width,
        numberOfSlabs: numberOfSlabs,
        reason: removeFormData.reason,
        notes: removeFormData.notes || undefined,
      });

      setRemoveFormData({
        barcode: '',
        marbleType: '',
        shade: '',
        slabSizeLength: '',
        slabSizeWidth: '',
        numberOfSlabs: '',
        reason: '',
        notes: '',
      });
      setScannedRemoveBarcode('');
      
      // Refresh inventory data after removing stock
      const response = await inventoryAPI.getAll();
      setInventory(response.marbles || []);
      
      // Refresh marble types data
      const marbleTypesResponse = await inventoryAPI.getMarbleTypes();
      if (marbleTypesResponse.marbleTypes) {
        setMarbleTypesData(marbleTypesResponse.marbleTypes);
      }
      
      setSuccessMessage(`Stock removed successfully! Removed: ${totalSquareFeet.toLocaleString()} sq ft`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove stock');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setAddFormData({
      ...addFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRemoveChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // If marble type changes, reset shade
    if (name === 'marbleType') {
      setRemoveFormData({
        ...removeFormData,
        marbleType: value,
        shade: '', // Reset shade when marble type changes
      });
    } else {
      setRemoveFormData({
        ...removeFormData,
        [name]: value,
      });
    }
  };

  const handleReserveChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // If marble type changes, reset shade
    if (name === 'marbleType') {
      setReserveFormData({
        ...reserveFormData,
        marbleType: value,
        shade: '', // Reset shade when marble type changes
      });
    } else {
      setReserveFormData({
        ...reserveFormData,
        [name]: value,
      });
    }
  };

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Calculate quantity from slab size and number of slabs
      const length = parseFloat(reserveFormData.slabSizeLength);
      const width = parseFloat(reserveFormData.slabSizeWidth);
      const numberOfSlabs = parseFloat(reserveFormData.numberOfSlabs);
      
      if (!length || !width || !numberOfSlabs) {
        throw new Error('Please enter valid slab size and number of slabs');
      }
      
      if (!reserveFormData.clientName) {
        throw new Error('Client name is required');
      }
      
      // Calculate total square feet: length (ft) × width (ft) × number of slabs
      const totalSquareFeet = length * width * numberOfSlabs;

      await stockAPI.reserve({
        barcode: reserveFormData.barcode || scannedReserveBarcode,
        marbleType: reserveFormData.marbleType,
        shade: reserveFormData.shade,
        slabSizeLength: length,
        slabSizeWidth: width,
        numberOfSlabs: numberOfSlabs,
        clientName: reserveFormData.clientName,
        clientPhone: reserveFormData.clientPhone || undefined,
        clientEmail: reserveFormData.clientEmail || undefined,
        notes: reserveFormData.notes || undefined,
      });

      setReserveFormData({
        barcode: '',
        marbleType: '',
        shade: '',
        slabSizeLength: '',
        slabSizeWidth: '',
        numberOfSlabs: '',
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        notes: '',
      });
      setScannedReserveBarcode('');
      
      // Refresh inventory data after reserving stock
      const response = await inventoryAPI.getAll();
      setInventory(response.marbles || []);
      
      // Refresh marble types data
      const marbleTypesResponse = await inventoryAPI.getMarbleTypes();
      if (marbleTypesResponse.marbleTypes) {
        setMarbleTypesData(marbleTypesResponse.marbleTypes);
      }
      
      setSuccessMessage(`Stock reserved successfully! Reserved: ${totalSquareFeet.toLocaleString()} sq ft for ${reserveFormData.clientName}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to reserve stock');
    } finally {
      setLoading(false);
    }
  };

  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox for shade activation
    if (type === 'checkbox' && name.startsWith('shade-')) {
      const shade = name.replace('shade-', '');
      setNewItemFormData({
        ...newItemFormData,
        shades: {
          ...newItemFormData.shades,
          [shade]: {
            ...newItemFormData.shades[shade as keyof typeof newItemFormData.shades],
            active: (e.target as HTMLInputElement).checked,
          },
        },
      });
      return;
    }
    
    // Handle shade pricing fields (format: "shade-field" e.g., "AA-costPrice", "A-salePrice", "B--salePrice")
    // Use lastIndexOf to handle shades with hyphens like "B-"
    if (name.includes('-') && !name.startsWith('shade-')) {
      const lastDashIndex = name.lastIndexOf('-');
      const shade = name.substring(0, lastDashIndex);
      const field = name.substring(lastDashIndex + 1);
      
      // Validate that this is a shade pricing field (field should be 'costPrice' or 'salePrice')
      if (field === 'costPrice' || field === 'salePrice') {
        setNewItemFormData({
          ...newItemFormData,
          shades: {
            ...newItemFormData.shades,
            [shade]: {
              ...newItemFormData.shades[shade as keyof typeof newItemFormData.shades],
              [field]: value,
            },
          },
        });
        return;
      }
    }
    
    // Handle regular fields
    {
      setNewItemFormData({
        ...newItemFormData,
        [name]: value,
      });
    }
  };

  const handleNewItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Get active shades
      const activeShades = Object.entries(newItemFormData.shades)
        .filter(([_, data]) => data.active);

      if (activeShades.length === 0) {
        setError('Please activate at least one shade');
        setLoading(false);
        return;
      }

      // Build shades array with pricing data (only for active shades)
      const shadesData = activeShades
        .map(([shade, data]) => ({
          shade,
          costPrice: parseFloat(data.costPrice),
          salePrice: parseFloat(data.salePrice),
        }))
        .filter((s) => !isNaN(s.costPrice) && !isNaN(s.salePrice)); // Filter out invalid entries

      // Validate that all active shades have both prices
      const incompleteShades = activeShades.filter(([_, data]) => !data.costPrice || !data.salePrice);
      if (incompleteShades.length > 0) {
        setError(`Please enter both cost and sale price for all active shades. Missing prices for: ${incompleteShades.map(([shade, _]) => shade).join(', ')}`);
        setLoading(false);
        return;
      }

      if (shadesData.length === 0) {
        setError('Please enter valid pricing for at least one active shade');
        setLoading(false);
        return;
      }

      // Validate that all prices are valid numbers
      const invalidShades = shadesData.filter(s => isNaN(s.costPrice) || isNaN(s.salePrice) || s.costPrice < 0 || s.salePrice < 0);
      if (invalidShades.length > 0) {
        setError(`Please enter valid prices (non-negative numbers) for all shades. Invalid prices for: ${invalidShades.map(s => s.shade).join(', ')}`);
        setLoading(false);
        return;
      }

      const response = await marblesAPI.create({
        marbleType: newItemFormData.marbleType,
        notes: newItemFormData.notes || undefined,
        shades: shadesData,
      });
      
      // Store the generated barcodes from response
      if (response.marbles && response.marbles.length > 0) {
        const barcodes = response.marbles.map((m: any) => `${m.color}: ${m.barcode}`).join(', ');
        setGeneratedBarcode(barcodes);
        setSuccessMessage(`New marble type created successfully! ${response.marbles.length} shade${response.marbles.length > 1 ? 's' : ''} added with barcodes. You can now use "Add Stock" to add inventory.`);
      } else {
        setSuccessMessage('New marble type created successfully! You can now use "Add Stock" to add inventory for this marble type.');
      }

      setNewItemFormData({
        marbleType: '',
        notes: '',
        shades: {
          AA: { active: false, costPrice: '', salePrice: '' },
          A: { active: false, costPrice: '', salePrice: '' },
          B: { active: false, costPrice: '', salePrice: '' },
          'B-': { active: false, costPrice: '', salePrice: '' },
        },
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

  // Extract unique marble types from inventory data
  const marbleTypes = useMemo(() => {
    const types = new Set<string>();
    inventory.forEach((marble: any) => {
      if (marble.marbleType) {
        types.add(marble.marbleType);
      }
    });
    return Array.from(types).sort();
  }, [inventory]);

  // Fetch marble types and shades for Remove Stock dropdowns
  useEffect(() => {
    const fetchMarbleTypes = async () => {
      try {
        const response = await inventoryAPI.getMarbleTypes();
        if (response.marbleTypes) {
          setMarbleTypesData(response.marbleTypes);
        }
      } catch (error) {
        console.error('Error fetching marble types:', error);
      }
    };
    
    if (activeTab === 'remove') {
      fetchMarbleTypes();
    }
  }, [activeTab]);

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
          setAddFormData({
            ...addFormData,
            marbleType: marble.marbleType,
            shade: marble.color || '', // Use color field for shade
          });
          setSuccessMessage(`Barcode scanned: ${barcode}. Marble: ${marble.marbleType} - ${marble.color}`);
          setTimeout(() => setSuccessMessage(null), 5000);
        } else if (activeTab === 'remove') {
          // Auto-populate Remove Stock form
          setRemoveFormData({
            ...removeFormData,
            barcode: barcode,
            marbleType: marble.marbleType,
            shade: marble.color || '', // Use color field for shade
          });
          setScannedRemoveBarcode(barcode);
          setSuccessMessage(`Barcode scanned: ${barcode}. Marble: ${marble.marbleType} - ${marble.color}`);
          setTimeout(() => setSuccessMessage(null), 5000);
        } else if (activeTab === 'reserve') {
          // Auto-populate Reserve Stock form
          setReserveFormData({
            ...reserveFormData,
            barcode: barcode,
            marbleType: marble.marbleType,
            shade: marble.color || '', // Use color field for shade
          });
          setScannedReserveBarcode(barcode);
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
              onClick={() => setActiveTab('reserve')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'reserve'
                  ? 'text-[#F59E0B]'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Reserve Stock
              </div>
              {activeTab === 'reserve' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F59E0B]"></div>
              )}
            </button>
            
            {userRole === 'Admin' && (
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
            )}
          </div>
        </div>

        {/* Add New Item Form - Admin Only */}
        {activeTab === 'new-item' && userRole === 'Admin' && (
          <form onSubmit={handleNewItemSubmit} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-[#1F2937] dark:text-white mb-2">Add New Marble Type</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create a new marble type with pricing information. Stock can be added later using "Add Stock".</p>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-6">
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

              {/* Shades Pricing Sections */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Shade Pricing <span className="text-[#DC2626]">*</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Activate shades and enter cost and sale price for each active shade.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['AA', 'A', 'B', 'B-'].map((shade) => {
                    const shadeData = newItemFormData.shades[shade as keyof typeof newItemFormData.shades];
                    const isActive = shadeData.active;
                    return (
                      <div
                        key={shade}
                        className={`border rounded-lg p-4 transition-all ${
                          isActive
                            ? 'border-[#2563EB] dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Shade: {shade}
                          </h5>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              name={`shade-${shade}`}
                              checked={isActive}
                              onChange={handleNewItemChange}
                              className="w-4 h-4 text-[#2563EB] border-gray-300 rounded focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:border-gray-600"
                            />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </label>
                        </div>
                        {isActive && (
                          <div className="space-y-3">
                            {/* Cost Price */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Cost Price / sq ft <span className="text-[#DC2626]">*</span>
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                                  PKR
                                </span>
                                <input
                                  type="number"
                                  name={`${shade}-costPrice`}
                                  value={shadeData.costPrice}
                                  onChange={handleNewItemChange}
                                  required={isActive}
                                  step="0.01"
                                  min="0"
                                  placeholder="e.g., 100.00"
                                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                                />
                              </div>
                            </div>
                            {/* Sale Price */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Sale Price / sq ft <span className="text-[#DC2626]">*</span>
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                                  PKR
                                </span>
                                <input
                                  type="number"
                                  name={`${shade}-salePrice`}
                                  value={shadeData.salePrice}
                                  onChange={handleNewItemChange}
                                  required={isActive}
                                  step="0.01"
                                  min="0"
                                  placeholder="e.g., 150.00"
                                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        {!isActive && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                            Activate this shade to enter pricing
                          </p>
                        )}
                      </div>
                    );
                  })}
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

            {/* Generated Barcodes Display */}
            {generatedBarcode && (
              <div className="mb-6">
                <div className="bg-[#D1FAE5] dark:bg-green-900 border border-[#16A34A] dark:border-green-700 rounded-lg p-4">
                  <p className="text-sm font-medium text-[#065F46] dark:text-green-300 mb-2">
                    ✓ Barcodes Generated Successfully
                  </p>
                  <div className="space-y-1">
                    {generatedBarcode.split(', ').map((barcodeInfo, index) => (
                      <p key={index} className="text-sm font-semibold text-[#065F46] dark:text-green-200">
                        {barcodeInfo}
                      </p>
                    ))}
                  </div>
                  <p className="text-xs text-[#065F46] dark:text-green-400 mt-2">
                    Each barcode identifies the marble type and shade. Use these barcodes to quickly add or remove stock.
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
                     notes: '',
                     shades: {
                       AA: { active: false, costPrice: '', salePrice: '' },
                       A: { active: false, costPrice: '', salePrice: '' },
                       B: { active: false, costPrice: '', salePrice: '' },
                       'B-': { active: false, costPrice: '', salePrice: '' },
                     },
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
                <select
                  name="marbleType"
                  value={addFormData.marbleType}
                  onChange={handleAddChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select marble type</option>
                  {filteredMarbleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select from existing marble types. Use "Add New Item" to create new marble types.
                </p>
              </div>

              {/* Shade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Shade <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  name="shade"
                  value={addFormData.shade}
                  onChange={handleAddChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select shade</option>
                  <option value="AA">AA</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="B-">B-</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Marble stock will be categorized by shade
                </p>
              </div>

              {/* Slab Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slab Size (ft) <span className="text-[#DC2626]">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    name="slabSizeLength"
                    value={addFormData.slabSizeLength}
                    onChange={handleAddChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Length"
                    className="flex-1 min-w-0 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                  />
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">×</span>
                  <input
                    type="number"
                    name="slabSizeWidth"
                    value={addFormData.slabSizeWidth}
                    onChange={handleAddChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Width"
                    className="flex-1 min-w-0 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter length and width in feet
                </p>
              </div>

              {/* Number of Slabs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Slabs <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="number"
                  name="numberOfSlabs"
                  value={addFormData.numberOfSlabs}
                  onChange={handleAddChange}
                  required
                  min="1"
                  step="1"
                  placeholder="e.g., 10"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Total quantity will be calculated: Length × Width × Number of Slabs
                </p>
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
                   shade: '',
                   slabSizeLength: '',
                   slabSizeWidth: '',
                   numberOfSlabs: '',
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
                    {addFormData.shade && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Shade: {addFormData.shade}
                      </p>
                    )}
                  </div>

                  <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Stock</p>
                    <p className="font-medium text-[#1F2937] dark:text-white">
                      {(() => {
                        if (!addFormData.marbleType) return '-';
                        // Find stock for this marble type and shade combination
                        const matchingStock = inventory.find((marble: any) => 
                          marble.marbleType === addFormData.marbleType && 
                          marble.color === addFormData.shade &&
                          marble.batchNumber === null // Only actual stock entries, not templates
                        );
                        if (matchingStock) {
                          return `${matchingStock.quantity.toLocaleString()} ${matchingStock.unit || 'sq ft'}`;
                        }
                        // Fallback to total stock for marble type if shade not selected or not found
                        const currentStock = availableStock.find(s => s.type === addFormData.marbleType);
                        return currentStock 
                          ? `${currentStock.available.toLocaleString()} ${currentStock.unit}`
                          : '0 sq ft';
                      })()}
                    </p>
                  </div>

                  <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Adding</p>
                    <p className="font-medium text-[#16A34A] dark:text-green-400">
                      {(() => {
                        const length = parseFloat(addFormData.slabSizeLength);
                        const width = parseFloat(addFormData.slabSizeWidth);
                        const numberOfSlabs = parseFloat(addFormData.numberOfSlabs);
                        if (length && width && numberOfSlabs) {
                          const totalSqFt = length * width * numberOfSlabs;
                          return `${totalSqFt.toLocaleString()} sq ft`;
                        }
                        return '-';
                      })()}
                    </p>
                    {addFormData.shade && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Shade: {addFormData.shade}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">New Total</p>
                    <p className="font-semibold text-[#1F2937] dark:text-white">
                      {(() => {
                        const length = parseFloat(addFormData.slabSizeLength);
                        const width = parseFloat(addFormData.slabSizeWidth);
                        const numberOfSlabs = parseFloat(addFormData.numberOfSlabs);
                        
                        if (!length || !width || !numberOfSlabs) return '-';
                        
                        const adding = length * width * numberOfSlabs;
                        
                        // Find stock for this marble type and shade combination
                        const matchingStock = inventory.find((marble: any) => 
                          marble.marbleType === addFormData.marbleType && 
                          marble.color === addFormData.shade &&
                          marble.batchNumber === null
                        );
                        
                        if (matchingStock) {
                          const newTotal = matchingStock.quantity + adding;
                          return `${newTotal.toLocaleString()} ${matchingStock.unit || 'sq ft'}`;
                        }
                        
                        // Fallback to total stock for marble type
                        const currentStock = availableStock.find(s => s.type === addFormData.marbleType);
                        if (currentStock) {
                          const newTotal = currentStock.available + adding;
                          return `${newTotal.toLocaleString()} ${currentStock.unit}`;
                        }
                        
                        // If no existing stock, just show what's being added
                        return `${adding.toLocaleString()} sq ft`;
                      })()}
                    </p>
                  </div>
                </div>

                {addFormData.marbleType && addFormData.slabSizeLength && addFormData.slabSizeWidth && addFormData.numberOfSlabs && (() => {
                  const currentStock = availableStock.find(s => s.type === addFormData.marbleType);
                  if (currentStock) {
                    const length = parseFloat(addFormData.slabSizeLength);
                    const width = parseFloat(addFormData.slabSizeWidth);
                    const numberOfSlabs = parseFloat(addFormData.numberOfSlabs);
                    const adding = length * width * numberOfSlabs;
                    const newTotal = currentStock.available + adding;
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
                <select
                  name="marbleType"
                  value={removeFormData.marbleType}
                  onChange={handleRemoveChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select marble type</option>
                  {marbleTypesData.map((item) => (
                    <option key={item.marbleType} value={item.marbleType}>
                      {item.marbleType}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {scannedRemoveBarcode ? `Barcode: ${scannedRemoveBarcode}` : 'Select from dropdown or scan barcode to auto-fill'}
                </p>
              </div>

              {/* Shade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Shade <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  name="shade"
                  value={removeFormData.shade}
                  onChange={handleRemoveChange}
                  required
                  disabled={!removeFormData.marbleType}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {removeFormData.marbleType ? 'Select shade' : 'Select marble type first'}
                  </option>
                  {removeFormData.marbleType && (() => {
                    const selectedMarble = marbleTypesData.find(m => m.marbleType === removeFormData.marbleType);
                    return selectedMarble?.shades.map((shade) => (
                      <option key={shade} value={shade}>
                        {shade}
                      </option>
                    ));
                  })()}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {scannedRemoveBarcode ? 'Auto-filled from barcode' : 'Select shade for the chosen marble type'}
                </p>
              </div>

              {/* Slab Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slab Size (ft) <span className="text-[#DC2626]">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    name="slabSizeLength"
                    value={removeFormData.slabSizeLength}
                    onChange={handleRemoveChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Length"
                    className="flex-1 min-w-0 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                  />
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">×</span>
                  <input
                    type="number"
                    name="slabSizeWidth"
                    value={removeFormData.slabSizeWidth}
                    onChange={handleRemoveChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Width"
                    className="flex-1 min-w-0 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter length and width in feet
                </p>
              </div>

              {/* Number of Slabs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Slabs <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="number"
                  name="numberOfSlabs"
                  value={removeFormData.numberOfSlabs}
                  onChange={handleRemoveChange}
                  required
                  min="1"
                  step="1"
                  placeholder="e.g., 10"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Total quantity will be calculated: Length × Width × Number of Slabs
                </p>
              </div>
            </div>

            {/* Reason */}
            <div className="mb-6">
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

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={removeFormData.notes}
                onChange={handleRemoveChange}
                rows={4}
                placeholder="Additional notes or comments..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-y"
              />
            </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setRemoveFormData({
                        barcode: '',
                        marbleType: '',
                        shade: '',
                        slabSizeLength: '',
                        slabSizeWidth: '',
                        numberOfSlabs: '',
                        reason: '',
                        notes: '',
                      });
                      setScannedRemoveBarcode('');
                    }}
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
                    {removeFormData.shade && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Shade: {removeFormData.shade}
                      </p>
                    )}
                  </div>

                  <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Stock</p>
                    <p className="font-medium text-[#1F2937] dark:text-white">
                      {(() => {
                        if (!removeFormData.marbleType) return '-';
                        // Find stock for this marble type and shade combination
                        const matchingStock = inventory.find((marble: any) => 
                          marble.marbleType === removeFormData.marbleType && 
                          marble.color === removeFormData.shade
                        );
                        if (matchingStock) {
                          return `${matchingStock.quantity.toLocaleString()} ${matchingStock.unit || 'sq ft'}`;
                        }
                        // Fallback to total stock for marble type if shade not selected or not found
                        const currentStock = availableStock.find(s => s.type === removeFormData.marbleType);
                        return currentStock 
                          ? `${currentStock.available.toLocaleString()} ${currentStock.unit}`
                          : '0 sq ft';
                      })()}
                    </p>
                  </div>

                  <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Removing</p>
                    <p className="font-medium text-[#DC2626] dark:text-red-400">
                      {(() => {
                        const length = parseFloat(removeFormData.slabSizeLength);
                        const width = parseFloat(removeFormData.slabSizeWidth);
                        const numberOfSlabs = parseFloat(removeFormData.numberOfSlabs);
                        if (length && width && numberOfSlabs) {
                          const totalSqFt = length * width * numberOfSlabs;
                          return `${totalSqFt.toLocaleString()} sq ft`;
                        }
                        return '-';
                      })()}
                    </p>
                    {removeFormData.slabSizeLength && removeFormData.slabSizeWidth && removeFormData.numberOfSlabs && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {removeFormData.slabSizeLength} × {removeFormData.slabSizeWidth} × {removeFormData.numberOfSlabs} slabs
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">New Total</p>
                    <p className="font-semibold text-[#1F2937] dark:text-white">
                      {(() => {
                        const length = parseFloat(removeFormData.slabSizeLength);
                        const width = parseFloat(removeFormData.slabSizeWidth);
                        const numberOfSlabs = parseFloat(removeFormData.numberOfSlabs);
                        
                        if (!length || !width || !numberOfSlabs || !removeFormData.marbleType) return '-';
                        
                        const removing = length * width * numberOfSlabs;
                        
                        // Find stock for this marble type and shade combination
                        const matchingStock = inventory.find((marble: any) => 
                          marble.marbleType === removeFormData.marbleType && 
                          marble.color === removeFormData.shade
                        );
                        
                        if (matchingStock) {
                          const newTotal = Math.max(0, matchingStock.quantity - removing);
                          return `${newTotal.toLocaleString()} ${matchingStock.unit || 'sq ft'}`;
                        }
                        
                        // Fallback to total stock for marble type
                        const currentStock = availableStock.find(s => s.type === removeFormData.marbleType);
                        if (currentStock) {
                          const newTotal = Math.max(0, currentStock.available - removing);
                          return `${newTotal.toLocaleString()} ${currentStock.unit}`;
                        }
                        
                        return '-';
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reserve Stock Form */}
        {activeTab === 'reserve' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <form onSubmit={handleReserveSubmit} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
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
                <select
                  name="marbleType"
                  value={reserveFormData.marbleType}
                  onChange={handleReserveChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select marble type</option>
                  {marbleTypesData.map((item) => (
                    <option key={item.marbleType} value={item.marbleType}>
                      {item.marbleType}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {scannedReserveBarcode ? `Barcode: ${scannedReserveBarcode}` : 'Select from dropdown or scan barcode to auto-fill'}
                </p>
              </div>

              {/* Shade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Shade <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  name="shade"
                  value={reserveFormData.shade}
                  onChange={handleReserveChange}
                  required
                  disabled={!reserveFormData.marbleType}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {reserveFormData.marbleType ? 'Select shade' : 'Select marble type first'}
                  </option>
                  {reserveFormData.marbleType && (() => {
                    const selectedMarble = marbleTypesData.find(m => m.marbleType === reserveFormData.marbleType);
                    return selectedMarble?.shades.map((shade) => (
                      <option key={shade} value={shade}>
                        {shade}
                      </option>
                    ));
                  })()}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {scannedReserveBarcode ? 'Auto-filled from barcode' : 'Select shade for the chosen marble type'}
                </p>
              </div>

              {/* Slab Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slab Size (ft) <span className="text-[#DC2626]">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    name="slabSizeLength"
                    value={reserveFormData.slabSizeLength}
                    onChange={handleReserveChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Length"
                    className="flex-1 min-w-0 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                  />
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">×</span>
                  <input
                    type="number"
                    name="slabSizeWidth"
                    value={reserveFormData.slabSizeWidth}
                    onChange={handleReserveChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Width"
                    className="flex-1 min-w-0 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter length and width in feet
                </p>
              </div>

              {/* Number of Slabs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Slabs <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="number"
                  name="numberOfSlabs"
                  value={reserveFormData.numberOfSlabs}
                  onChange={handleReserveChange}
                  required
                  min="1"
                  step="1"
                  placeholder="e.g., 10"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Total quantity will be calculated: Length × Width × Number of Slabs
                </p>
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={reserveFormData.clientName}
                  onChange={handleReserveChange}
                  required
                  placeholder="Enter client name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Client Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client Phone
                </label>
                <input
                  type="tel"
                  name="clientPhone"
                  value={reserveFormData.clientPhone}
                  onChange={handleReserveChange}
                  placeholder="Enter client phone"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Client Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client Email
                </label>
                <input
                  type="email"
                  name="clientEmail"
                  value={reserveFormData.clientEmail}
                  onChange={handleReserveChange}
                  placeholder="Enter client email"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={reserveFormData.notes}
                onChange={handleReserveChange}
                rows={4}
                placeholder="Additional notes or comments..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-y"
              />
            </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setReserveFormData({
                        barcode: '',
                        marbleType: '',
                        shade: '',
                        slabSizeLength: '',
                        slabSizeWidth: '',
                        numberOfSlabs: '',
                        clientName: '',
                        clientPhone: '',
                        clientEmail: '',
                        notes: '',
                      });
                      setScannedReserveBarcode('');
                    }}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-[#F59E0B] dark:bg-yellow-600 text-white rounded-lg hover:bg-[#D97706] dark:hover:bg-yellow-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-200 dark:disabled:text-gray-400"
                  >
                    <Package className="w-4 h-4" />
                    {loading ? 'Reserving...' : 'Reserve Stock'}
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
                      {reserveFormData.marbleType || 'None selected'}
                    </p>
                    {reserveFormData.shade && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Shade: {reserveFormData.shade}
                      </p>
                    )}
                  </div>

                  <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Stock</p>
                    <p className="font-medium text-[#1F2937] dark:text-white">
                      {(() => {
                        if (!reserveFormData.marbleType) return '-';
                        // Find stock for this marble type and shade combination
                        const matchingStock = inventory.find((marble: any) => 
                          marble.marbleType === reserveFormData.marbleType && 
                          marble.color === reserveFormData.shade
                        );
                        if (matchingStock) {
                          return `${matchingStock.quantity.toLocaleString()} ${matchingStock.unit || 'sq ft'}`;
                        }
                        // Fallback to total stock for marble type if shade not selected or not found
                        const currentStock = availableStock.find(s => s.type === reserveFormData.marbleType);
                        return currentStock 
                          ? `${currentStock.available.toLocaleString()} ${currentStock.unit}`
                          : '0 sq ft';
                      })()}
                    </p>
                  </div>

                  <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Reserving</p>
                    <p className="font-medium text-[#F59E0B] dark:text-yellow-400">
                      {(() => {
                        const length = parseFloat(reserveFormData.slabSizeLength);
                        const width = parseFloat(reserveFormData.slabSizeWidth);
                        const numberOfSlabs = parseFloat(reserveFormData.numberOfSlabs);
                        if (length && width && numberOfSlabs) {
                          const totalSqFt = length * width * numberOfSlabs;
                          return `${totalSqFt.toLocaleString()} sq ft`;
                        }
                        return '-';
                      })()}
                    </p>
                    {reserveFormData.slabSizeLength && reserveFormData.slabSizeWidth && reserveFormData.numberOfSlabs && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {reserveFormData.slabSizeLength} × {reserveFormData.slabSizeWidth} × {reserveFormData.numberOfSlabs} slabs
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">New Total</p>
                    <p className="font-semibold text-[#1F2937] dark:text-white">
                      {(() => {
                        const length = parseFloat(reserveFormData.slabSizeLength);
                        const width = parseFloat(reserveFormData.slabSizeWidth);
                        const numberOfSlabs = parseFloat(reserveFormData.numberOfSlabs);
                        
                        if (!length || !width || !numberOfSlabs || !reserveFormData.marbleType) return '-';
                        
                        const reserving = length * width * numberOfSlabs;
                        
                        // Find stock for this marble type and shade combination
                        const matchingStock = inventory.find((marble: any) => 
                          marble.marbleType === reserveFormData.marbleType && 
                          marble.color === reserveFormData.shade
                        );
                        
                        if (matchingStock) {
                          const newTotal = Math.max(0, matchingStock.quantity - reserving);
                          return `${newTotal.toLocaleString()} ${matchingStock.unit || 'sq ft'}`;
                        }
                        
                        // Fallback to total stock for marble type
                        const currentStock = availableStock.find(s => s.type === reserveFormData.marbleType);
                        if (currentStock) {
                          const newTotal = Math.max(0, currentStock.available - reserving);
                          return `${newTotal.toLocaleString()} ${currentStock.unit}`;
                        }
                        
                        return '-';
                      })()}
                    </p>
                  </div>

                  {reserveFormData.clientName && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Client</p>
                      <p className="font-medium text-[#1F2937] dark:text-white">
                        {reserveFormData.clientName}
                      </p>
                    </div>
                  )}
                </div>
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
