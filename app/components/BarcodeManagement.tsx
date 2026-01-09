'use client'

import { useState, useEffect, useRef } from 'react';
import { Barcode, Eye, Printer, Download, ChevronDown, FileImage, FileText, Image, File, Code } from 'lucide-react';
import { barcodeAPI } from '@/lib/api';
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const barcodeSvgRef = useRef<SVGSVGElement>(null);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBarcodes();
  }, [searchQuery]);

  useEffect(() => {
    // Generate scannable barcode when selectedBarcode changes
    if (selectedBarcode && barcodeSvgRef.current) {
      try {
        // Clear previous barcode
        barcodeSvgRef.current.innerHTML = '';
        JsBarcode(barcodeSvgRef.current, selectedBarcode.barcodeValue, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
          background: "transparent",
          lineColor: "#000000",
          margin: 10,
          fontSize: 16
        });
      } catch (error) {
        console.error('Error generating barcode preview:', error);
      }
    }
  }, [selectedBarcode]);

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

  const printBarcode = (item: BarcodeItem) => {
    // Create a temporary printable container
    const printContainer = document.createElement('div');
    printContainer.id = 'print-barcode-container';
    printContainer.innerHTML = `
      <div class="print-barcode-wrapper">
        <div class="print-barcode-content">
          <div class="print-marble-name">${item.marbleType}</div>
          <div class="print-barcode-visual">
            <svg id="print-barcode-svg" style="width:100%; height:80px; display:block; margin:0 auto;"></svg>
          </div>
          <div class="print-barcode-value">${item.barcodeValue}</div>
          <div class="print-barcode-type">CODE 128</div>
          <div class="print-barcode-info">
            <p><strong>ID:</strong> ${item.id}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    `;

    // Add print styles
    const printStyles = document.createElement('style');
    printStyles.id = 'print-barcode-styles';
    printStyles.textContent = `
      @media screen {
        #print-barcode-container {
          position: fixed;
          top: -9999px;
          left: -9999px;
          visibility: hidden;
        }
      }
      @media print {
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body * {
          visibility: hidden;
        }
        #print-barcode-container,
        #print-barcode-container * {
          visibility: visible;
        }
        #print-barcode-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
        }
        .print-barcode-wrapper {
          width: 100%;
          max-width: 400px;
          padding: 40px;
        }
        .print-barcode-content {
          text-align: center;
          padding: 30px;
          border: 2px solid #000;
          border-radius: 8px;
          background: white;
        }
        .print-marble-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
          color: #000;
        }
        .print-barcode-visual {
          margin: 30px 0;
          padding: 20px;
          background: white;
        }
        #print-barcode-svg {
          width: 100%;
          height: 80px;
          max-width: 400px;
          display: block;
          margin: 0 auto;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
        .print-barcode-value {
          font-family: 'Courier New', monospace;
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 2px;
          margin: 20px 0 10px 0;
          color: #000;
        }
        .print-barcode-type {
          font-size: 12px;
          color: #666;
          margin-bottom: 20px;
        }
        .print-barcode-info {
          margin-top: 20px;
          font-size: 14px;
          color: #333;
        }
        .print-barcode-info p {
          margin: 5px 0;
        }
      }
    `;

    // Add to document
    document.head.appendChild(printStyles);
    document.body.appendChild(printContainer);

    // Generate barcode in the print container
    const printSvg = document.getElementById('print-barcode-svg') as SVGSVGElement;
    if (printSvg) {
      try {
        JsBarcode(printSvg, item.barcodeValue, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: false,
          background: "#ffffff",
          lineColor: "#000000",
          margin: 10
        });

        // Trigger print dialog
        setTimeout(() => {
          window.print();
        }, 100);
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }

    // Clean up after printing
    const cleanup = () => {
      if (printContainer.parentNode) {
        printContainer.parentNode.removeChild(printContainer);
      }
      if (printStyles.parentNode) {
        printStyles.parentNode.removeChild(printStyles);
      }
    };

    // Clean up when print dialog is closed
    window.addEventListener('afterprint', cleanup, { once: true });
  };

  const handlePrintBarcode = (item: BarcodeItem) => {
    printBarcode(item);
  };

  const handlePrintSelected = () => {
    if (selectedBarcode) {
      printBarcode(selectedBarcode);
    }
  };

  // Generate barcode SVG element
  const generateBarcodeSvg = (barcodeValue: string, displayValue: boolean = true) => {
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tempSvg.setAttribute('width', '400');
    tempSvg.setAttribute('height', '200');
    tempSvg.setAttribute('style', 'background: white;');

    JsBarcode(tempSvg, barcodeValue, {
      format: "CODE128",
      width: 2,
      height: 80,
      displayValue: displayValue,
      background: "#ffffff",
      lineColor: "#000000",
      margin: 10,
      fontSize: 20
    });

    return tempSvg;
  };

  // Create a printable container for canvas/PDF conversion
  const createBarcodeContainer = (barcodeValue: string, marbleType: string, id: string) => {
    const container = document.createElement('div');
    container.style.cssText = 'padding: 30px; text-align: center; background: white; width: 400px;';
    
    const svg = generateBarcodeSvg(barcodeValue, true);
    svg.style.cssText = 'margin: 20px 0;';
    
    container.innerHTML = `
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">${marbleType}</div>
    `;
    container.appendChild(svg);
    container.innerHTML += `
      <div style="font-family: monospace; font-size: 20px; margin-top: 10px;">${barcodeValue}</div>
      <div style="font-size: 12px; color: #666; margin-top: 5px;">CODE 128</div>
      <div style="font-size: 14px; margin-top: 20px;">
        <p>ID: ${id}</p>
        <p>Date: ${new Date().toLocaleDateString()}</p>
      </div>
    `;
    
    return container;
  };

  const downloadAsSVG = async () => {
    if (!selectedBarcode) return;

    try {
      const svg = generateBarcodeSvg(selectedBarcode.barcodeValue, true);
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `barcode-${selectedBarcode.barcodeValue}-${selectedBarcode.marbleType.replace(/\s+/g, '-')}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error downloading SVG:', error);
    }
  };

  const downloadAsPNG = async () => {
    if (!selectedBarcode) return;

    try {
      const container = createBarcodeContainer(
        selectedBarcode.barcodeValue,
        selectedBarcode.marbleType,
        selectedBarcode.id
      );
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `barcode-${selectedBarcode.barcodeValue}-${selectedBarcode.marbleType.replace(/\s+/g, '-')}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 100);
        }
        document.body.removeChild(container);
      }, 'image/png');
    } catch (error) {
      console.error('Error downloading PNG:', error);
    }
  };

  const downloadAsJPEG = async () => {
    if (!selectedBarcode) return;

    try {
      const container = createBarcodeContainer(
        selectedBarcode.barcodeValue,
        selectedBarcode.marbleType,
        selectedBarcode.id
      );
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `barcode-${selectedBarcode.barcodeValue}-${selectedBarcode.marbleType.replace(/\s+/g, '-')}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 100);
        }
        document.body.removeChild(container);
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Error downloading JPEG:', error);
    }
  };

  const downloadAsPDF = async () => {
    if (!selectedBarcode) return;

    try {
      const container = createBarcodeContainer(
        selectedBarcode.barcodeValue,
        selectedBarcode.marbleType,
        selectedBarcode.id
      );
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`barcode-${selectedBarcode.barcodeValue}-${selectedBarcode.marbleType.replace(/\s+/g, '-')}.pdf`);
      document.body.removeChild(container);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const handleDownloadFormat = (format: 'svg' | 'png' | 'jpeg' | 'pdf') => {
    setShowDownloadDropdown(false);
    switch (format) {
      case 'svg':
        downloadAsSVG();
        break;
      case 'png':
        downloadAsPNG();
        break;
      case 'jpeg':
        downloadAsJPEG();
        break;
      case 'pdf':
        downloadAsPDF();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target as Node)) {
        setShowDownloadDropdown(false);
      }
    };

    if (showDownloadDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadDropdown]);

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
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{item.marbleType}</div>
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
                    <p className="text-sm font-medium text-gray-700 dark:text-white">
                      {selectedBarcode.marbleType}
                    </p>
                  </div>

                  {/* Barcode Display */}
                  <div className="mb-6 p-6 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center">
                    {/* Scannable Barcode Visualization (Code 128) */}
                    <div className="mb-4 w-full flex justify-center">
                      <svg
                        ref={barcodeSvgRef}
                        className="max-w-full h-auto dark:invert"
                        style={{ maxHeight: '80px' }}
                      />
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
                    <div className="relative" ref={downloadDropdownRef}>
                      <button
                        onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <Download className="w-5 h-5" />
                        Download
                        <ChevronDown className={`w-4 h-4 transition-transform ${showDownloadDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showDownloadDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-10">
                          <button
                            onClick={() => handleDownloadFormat('svg')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                          >
                            <span>Download as SVG</span>
                            <Code className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDownloadFormat('png')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700 flex items-center justify-between"
                          >
                            <span>Download as PNG</span>
                            <Image className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDownloadFormat('jpeg')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700 flex items-center justify-between"
                          >
                            <span>Download as JPEG</span>
                            <Image className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDownloadFormat('pdf')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700 flex items-center justify-between"
                          >
                            <span>Download as PDF</span>
                            <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
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

