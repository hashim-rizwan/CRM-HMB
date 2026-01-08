'use client'

import Link from 'next/link'

export function ManageStock() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#1F2937] mb-6">Manage Stock</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#1F2937] mb-2">Add Stock</h2>
          <p className="text-sm text-gray-600 mb-4">
            Scan a barcode or enter it manually to add new stock to inventory.
          </p>
          <Link
            href="/add-stock"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#16A34A] text-white text-sm font-medium hover:bg-[#15803D] transition-colors"
          >
            Go to Add Stock
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#1F2937] mb-2">Remove Stock</h2>
          <p className="text-sm text-gray-600 mb-4">
            Scan a barcode or enter it manually to remove stock from inventory.
          </p>
          <Link
            href="/remove-stock"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#DC2626] text-white text-sm font-medium hover:bg-[#B91C1C] transition-colors"
          >
            Go to Remove Stock
          </Link>
        </div>
      </div>
    </div>
  )
}


