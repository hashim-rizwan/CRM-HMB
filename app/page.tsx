import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Inventory Dashboard</h1>
      <nav style={{ marginTop: '2rem' }}>
        <Link href="/add-stock" style={{ marginRight: '1rem' }}>
          Add Stock
        </Link>
        <Link href="/remove-stock">Remove Stock</Link>
      </nav>
    </main>
  )
}

