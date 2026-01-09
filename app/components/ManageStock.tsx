'use client'

import { useState } from 'react';
import { Plus, Minus, Save, Trash2, Scan, Barcode } from 'lucide-react';

interface ManageStockProps {
  searchQuery?: string;
}

export function ManageStock({ searchQuery = '' }: ManageStockProps) {
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  
  const [addFormData, setAddFormData] = useState({
    marbleType: '',
    color: '',
    quantity: '',
    unit: 'kg',
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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding stock:', addFormData);
    setAddFormData({
      marbleType: '',
      color: '',
      quantity: '',
      unit: 'kg',
      location: '',
      supplier: '',
      batchNumber: '',
      costPrice: '',
      salePrice: '',
      notes: '',
    });
    alert('Stock added successfully!');
  };

  const handleRemoveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Removing stock:', removeFormData);
    setRemoveFormData({
      marbleType: '',
      quantity: '',
      reason: '',
      requestedBy: '',
      notes: '',
    });
    alert('Stock removed successfully!');
  };

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setAddFormData({
      ...addFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRemoveChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setRemoveFormData({
      ...removeFormData,
      [e.target.name]: e.target.value,
    });
  };

  const marbleTypes = [
    'Carrara',
    'Calacatta',
    'Emperador',
    'Nero Marquina',
    'Crema Marfil',
    'Rosso Verona',
    'Verde Guatemala',
    'Statuario',
    'Arabescato',
    'Breccia',
  ];

  const locations = ['A-01', 'A-02', 'B-01', 'B-02', 'C-01', 'C-02', 'D-01', 'D-02', 'E-01', 'E-02'];

  const availableStock = [
    { type: 'Carrara', available: 2450, unit: 'kg' },
    { type: 'Calacatta', available: 850, unit: 'kg' },
    { type: 'Emperador', available: 320, unit: 'kg' },
    { type: 'Nero Marquina', available: 1680, unit: 'kg' },
    { type: 'Crema Marfil', available: 150, unit: 'kg' },
    { type: 'Rosso Verona', available: 920, unit: 'kg' },
    { type: 'Statuario', available: 1200, unit: 'kg' },
  ];

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

  const handleBarcodeScanned = (barcode: string) => {
    setScannedBarcode(barcode);
    // Mock auto-populate based on barcode
    if (activeTab === 'add') {
      setAddFormData({
        ...addFormData,
        batchNumber: barcode,
        marbleType: 'Carrara', // Mock data
        color: 'White',
      });
    }
    setShowBarcodeScanner(false);
    alert(`Barcode scanned: ${barcode}`);
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with Tabs */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-[#1F2937] mb-4">Manage Stock</h3>
          
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('add')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'add'
                  ? 'text-[#16A34A]'
                  : 'text-gray-500 hover:text-gray-700'
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
                  : 'text-gray-500 hover:text-gray-700'
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
          </div>
        </div>

        {/* Add Stock Form */}
        {activeTab === 'add' && (
          <form onSubmit={handleAddSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {/* Barcode Scanner Button */}
            <div className="mb-6 flex justify-end">
              <button
                type="button"
                onClick={handleScanBarcode}
                className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors flex items-center gap-2"
              >
                <Scan className="w-4 h-4" />
                Scan Barcode
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Marble Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marble Type <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  name="marbleType"
                  value={addFormData.marbleType}
                  onChange={handleAddChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="">Select marble type</option>
                  {filteredMarbleTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  name="color"
                  value={addFormData.color}
                  onChange={handleAddChange}
                  required
                  placeholder="e.g., White, Brown, Black"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  name="unit"
                  value={addFormData.unit}
                  onChange={handleAddChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="ton">Tons</option>
                  <option value="sqm">Square Meters (m²)</option>
                  <option value="pcs">Pieces</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Storage Location <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  name="location"
                  value={addFormData.location}
                  onChange={handleAddChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="">Select location</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={addFormData.supplier}
                  onChange={handleAddChange}
                  placeholder="Supplier name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              {/* Batch Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Number
                </label>
                <input
                  type="text"
                  name="batchNumber"
                  value={addFormData.batchNumber}
                  onChange={handleAddChange}
                  placeholder="e.g., BATCH-2026-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              {/* Cost Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    PKR
                  </span>
                  <input
                    type="number"
                    name="costPrice"
                    value={addFormData.costPrice}
                    onChange={handleAddChange}
                    placeholder="e.g., 100.00"
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              {/* Sale Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sale Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    PKR
                  </span>
                  <input
                    type="number"
                    name="salePrice"
                    value={addFormData.salePrice}
                    onChange={handleAddChange}
                    placeholder="e.g., 150.00"
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={addFormData.notes}
                onChange={handleAddChange}
                rows={4}
                placeholder="Additional notes or comments..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => setAddFormData({
                  marbleType: '',
                  color: '',
                  quantity: '',
                  unit: 'kg',
                  location: '',
                  supplier: '',
                  batchNumber: '',
                  costPrice: '',
                  salePrice: '',
                  notes: '',
                })}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#16A34A] text-white rounded-lg hover:bg-[#15803D] transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Add Stock
              </button>
            </div>
          </form>
        )}

        {/* Remove Stock Form */}
        {activeTab === 'remove' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <form onSubmit={handleRemoveSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="space-y-6 mb-6">
                  {/* Marble Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marble Type <span className="text-[#DC2626]">*</span>
                    </label>
                    <select
                      name="marbleType"
                      value={removeFormData.marbleType}
                      onChange={handleRemoveChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                        {selectedStock?.unit || 'kg'}
                      </span>
                    </div>
                    {selectedStock && (
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum available: {selectedStock.available.toLocaleString()} {selectedStock.unit}
                      </p>
                    )}
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Removal <span className="text-[#DC2626]">*</span>
                    </label>
                    <select
                      name="reason"
                      value={removeFormData.reason}
                      onChange={handleRemoveChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      <option value="">Select reason</option>
                      {reasons.map((reason) => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                  </div>

                  {/* Requested By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requested By
                    </label>
                    <input
                      type="text"
                      name="requestedBy"
                      value={removeFormData.requestedBy}
                      onChange={handleRemoveChange}
                      placeholder="Name or department"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={removeFormData.notes}
                      onChange={handleRemoveChange}
                      rows={4}
                      placeholder="Additional details..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Stock
                  </button>
                </div>
              </form>
            </div>

            {/* Summary Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
                <h4 className="font-semibold text-[#1F2937] mb-4">Quick Summary</h4>
                
                <div className="space-y-4">
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Selected Item</p>
                    <p className="font-medium text-[#1F2937]">
                      {removeFormData.marbleType || 'None selected'}
                    </p>
                  </div>

                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Available Stock</p>
                    <p className="font-medium text-[#1F2937]">
                      {selectedStock 
                        ? `${selectedStock.available.toLocaleString()} ${selectedStock.unit}`
                        : '-'
                      }
                    </p>
                  </div>

                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Removing</p>
                    <p className="font-medium text-[#DC2626]">
                      {removeFormData.quantity 
                        ? `${parseFloat(removeFormData.quantity).toLocaleString()} ${selectedStock?.unit || 'kg'}`
                        : '-'
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Remaining Stock</p>
                    <p className="font-semibold text-[#1F2937]">
                      {selectedStock && removeFormData.quantity
                        ? `${(selectedStock.available - parseFloat(removeFormData.quantity)).toLocaleString()} ${selectedStock.unit}`
                        : '-'
                      }
                    </p>
                  </div>
                </div>

                {selectedStock && removeFormData.quantity && (selectedStock.available - parseFloat(removeFormData.quantity)) < 500 && (
                  <div className="mt-4 p-3 bg-[#FEF3C7] border border-[#F59E0B] rounded-lg">
                    <p className="text-xs text-[#92400E]">
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#1F2937]">Barcode Scanner</h3>
              <button
                onClick={() => setShowBarcodeScanner(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center">
                <Barcode className="w-20 h-20 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 text-center mb-2">Position barcode in scanner view</p>
                <p className="text-xs text-gray-500 text-center">Scanner ready...</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or enter barcode manually:
              </label>
              <input
                type="text"
                value={scannedBarcode}
                onChange={(e) => setScannedBarcode(e.target.value)}
                placeholder="Enter barcode number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => scannedBarcode && handleBarcodeScanned(scannedBarcode)}
                disabled={!scannedBarcode}
                className="flex-1 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
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
