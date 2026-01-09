'use client'

import { useState } from 'react';
import { Barcode, Eye, Printer, Download } from 'lucide-react';

interface BarcodeItem {
  id: string;
  marbleName: string;
  marbleType: string;
  barcodeValue: string;
  lastPrinted: string;
}

const mockBarcodes: BarcodeItem[] = [
  { id: '001', marbleName: 'Carrara White', marbleType: 'Carrara', barcodeValue: '3001234567890', lastPrinted: '2026-01-08' },
  { id: '002', marbleName: 'Calacatta Gold', marbleType: 'Calacatta', barcodeValue: '3001234567891', lastPrinted: '2026-01-07' },
  { id: '003', marbleName: 'Emperador Brown', marbleType: 'Emperador', barcodeValue: '3001234567892', lastPrinted: '2026-01-08' },
  { id: '004', marbleName: 'Nero Marquina Black', marbleType: 'Nero Marquina', barcodeValue: '3001234567893', lastPrinted: '2026-01-06' },
  { id: '005', marbleName: 'Crema Marfil Beige', marbleType: 'Crema Marfil', barcodeValue: '3001234567894', lastPrinted: '2026-01-08' },
  { id: '006', marbleName: 'Rosso Verona Red', marbleType: 'Rosso Verona', barcodeValue: '3001234567895', lastPrinted: '2026-01-05' },
  { id: '007', marbleName: 'Verde Guatemala Green', marbleType: 'Verde Guatemala', barcodeValue: '3001234567896', lastPrinted: '2026-01-03' },
  { id: '008', marbleName: 'Statuario White/Grey', marbleType: 'Statuario', barcodeValue: '3001234567897', lastPrinted: '2026-01-08' },
];

export function BarcodeManagement() {
  const [selectedBarcode, setSelectedBarcode] = useState<BarcodeItem | null>(mockBarcodes[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBarcodes = mockBarcodes.filter(
    (item) =>
      item.marbleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcodeValue.includes(searchQuery)
  );

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
          <h3 className="text-xl font-semibold text-[#1F2937]">Barcode Management</h3>
          <p className="text-sm text-gray-600 mt-1">View, print, and manage product barcodes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Barcode List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Search Bar */}
              <div className="p-6 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search by marble name or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              {/* Barcode Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBarcodes.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedBarcode?.id === item.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedBarcode(item)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.marbleName}</div>
                          <div className="text-sm text-gray-500">{item.marbleType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Barcode className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-mono text-gray-900">{item.barcodeValue}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.lastPrinted}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBarcode(item);
                              }}
                              className="p-2 text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Barcode"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintBarcode(item);
                              }}
                              className="p-2 text-[#16A34A] hover:bg-green-50 rounded-lg transition-colors"
                              title="Print Barcode"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Barcode Preview Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h4 className="font-semibold text-[#1F2937] mb-4">Barcode Preview</h4>

              {selectedBarcode ? (
                <div>
                  {/* Marble Info */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {selectedBarcode.marbleName}
                    </p>
                    <p className="text-xs text-gray-500">{selectedBarcode.marbleType}</p>
                  </div>

                  {/* Barcode Display */}
                  <div className="mb-6 p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
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
                      <p className="font-mono text-lg font-medium text-gray-900 mb-1">
                        {selectedBarcode.barcodeValue}
                      </p>
                      <p className="text-xs text-gray-500">CODE 128</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mb-6 text-sm text-gray-600">
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
                      className="w-full px-4 py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <Printer className="w-5 h-5" />
                      Print Barcode
                    </button>
                    <button
                      onClick={handleDownloadBarcode}
                      className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Barcode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Select a barcode to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

