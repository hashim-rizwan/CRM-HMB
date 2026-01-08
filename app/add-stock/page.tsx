'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AddStock() {
  const [barcode, setBarcode] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    barcodeInputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcode || !quantity) return

    setLoading(true)
    try {
      const response = await fetch('/api/stock/in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode, quantity: parseInt(quantity) }),
      })

      if (response.ok) {
        setBarcode('')
        setQuantity('')
        barcodeInputRef.current?.focus()
      }
    } catch (error) {
      console.error('Error adding stock:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Add Stock</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Barcode:
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && barcode) {
                  e.preventDefault()
                  document.getElementById('quantity-input')?.focus()
                }
              }}
              style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Quantity:
            <input
              id="quantity-input"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && barcode && quantity) {
                  handleSubmit(e)
                }
              }}
              style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
            />
          </label>
        </div>
        <button type="submit" disabled={loading || !barcode || !quantity}>
          {loading ? 'Adding...' : 'Add Stock'}
        </button>
      </form>
      <div style={{ marginTop: '2rem' }}>
        <a href="/" style={{ color: 'blue' }}>
          Back to Dashboard
        </a>
      </div>
    </main>
  )
}

