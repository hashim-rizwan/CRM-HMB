'use client'

import { useState, useEffect } from 'react';
import { Barcode, Eye, Printer, Download } from 'lucide-react';
import { barcodeAPI } from '@/lib/api';

interface BarcodeItem {
  id: string;
  marbleName: string;
  marbleType: string;
  barcodeValue: string;
  lastPrinted: string;
}

export function BarcodeManagement() {
  const [barcodes, setBarcodes] = useState<BarcodeItem[]>([]);
  const [selectedBarcode, setSelectedBarcode] = useState<BarcodeItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBarcodes();
  }, [searchQuery]);

  const fetchBarcodes = async () => {
    try {
      setLoading(true);
      const response = await barcodeAPI.getAll(searchQuery);
      const fetchedBarcodes = response.barcodes || [];
      setBarcodes(fetchedBarcodes);
      // Auto-select first barcode if none selected and barcodes exist
      if (fetchedBarcodes.length > 0 && !selectedBarcode) {
        setSelectedBarcode(fetchedBarcodes[0]);
      }
    } catch (err) {
      console.error('Error fetching barcodes:', err);
      setBarcodes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBarcodes = barcodes;

  const handlePrintBarcode = (item: BarcodeItem) => {
    alert(`Printing barcode for ${item.marbleName}`);
  };

  const handlePrintSelected = () => {
    if (selectedBarcode) {
      alert(`Printing barcode: ${selectedBarcode.barcodeValue}`);
    }
  };

  const handleDownloadBarcode = () => {
    if (selectedBarcode) {
      alert(`Downloading barcode: ${selectedBarcode.barcodeValue}`);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-[#1F2937] dark:text-white">Barcode Management</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">View, print, and manage product barcodes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Barcode List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
              {/* Search Bar */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <input
                  type="text"
                  placeholder="Search by marble name or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Barcode Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Marble Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Barcode Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Printed
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                          Loading barcodes...
                        </td>
                      </tr>
                    ) : filteredBarcodes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                          No barcodes found
                        </td>
                      </tr>
                    ) : (
                      filteredBarcodes.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                          selectedBarcode?.id === item.id ? 'bg-blue-50 dark:bg-gray-800' : ''
                        }`}
                        onClick={() => setSelectedBarcode(item)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{item.marbleName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{item.marbleType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Barcode className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-mono text-gray-900 dark:text-white">{item.barcodeValue}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {item.lastPrinted}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBarcode(item);
                              }}
                              className="p-2 text-[#2563EB] hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              title="View Barcode"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintBarcode(item);
                              }}
                              className="p-2 text-[#16A34A] hover:bg-green-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              title="Print Barcode"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Barcode Preview Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 sticky top-8">
              <h4 className="font-semibold text-[#1F2937] dark:text-white mb-4">Barcode Preview</h4>

              {selectedBarcode ? (
                <div>
                  {/* Marble Info */}
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 dark:text-white mb-1">
                      {selectedBarcode.marbleName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedBarcode.marbleType}</p>
                  </div>

                  {/* Barcode Display */}
                  <div className="mb-6 p-6 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center">
                    {/* Barcode Visualization (Code 128 style) */}
                    <div className="mb-4 flex items-center gap-0.5">
                      {/* Simulated barcode bars */}
                      {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 2, 1, 4].map(
                        (height, idx) => (
                          <div
                            key={idx}
                            className="bg-black"
                            style={{
                              width: `${Math.random() > 0.5 ? 3 : 2}px`,
                              height: `${height * 15}px`,
                            }}
                          />
                        )
                      )}
                    </div>

                    {/* Human-readable barcode */}
                    <div className="text-center">
                      <p className="font-mono text-lg font-medium text-gray-900 dark:text-white mb-1">
                        {selectedBarcode.barcodeValue}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">CODE 128</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                    <p className="mb-2">
                      <span className="font-medium">ID:</span> {selectedBarcode.id}
                    </p>
                    <p>
                      <span className="font-medium">Last Printed:</span> {selectedBarcode.lastPrinted}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={handlePrintSelected}
                      className="w-full px-4 py-3 bg-[#2563EB] dark:bg-blue-600 text-white rounded-lg hover:bg-[#1E40AF] dark:hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <Printer className="w-5 h-5" />
                      Print Barcode
                    </button>
                    <button
                      onClick={handleDownloadBarcode}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Barcode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Select a barcode to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

