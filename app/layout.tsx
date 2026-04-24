import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Marble Inventory System',
  description: 'Inventory management for marble factory',
  icons: {
    icon: '/images/haqeeq-logo.png',
    apple: '/images/haqeeq-logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

