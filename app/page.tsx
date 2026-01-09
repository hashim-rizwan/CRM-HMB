'use client'

import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { InventoryDashboard } from './components/InventoryDashboard'
import { ManageStock } from './components/ManageStock'
import { MonthlyReport } from './components/MonthlyReport'

export default function App() {
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')

  const getScreenTitle = () => {
    switch (activeScreen) {
      case 'dashboard':
        return 'Inventory Dashboard'
      case 'manage-stock':
        return 'Manage Stock'
      case 'report':
        return 'Monthly Usage Report'
      default:
        return 'Inventory Dashboard'
    }
  }

  const renderContent = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <InventoryDashboard searchQuery={searchQuery} />
      case 'manage-stock':
        return <ManageStock searchQuery={searchQuery} />
      case 'report':
        return <MonthlyReport searchQuery={searchQuery} />
      default:
        return <InventoryDashboard searchQuery={searchQuery} />
    }
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      {/* Sidebar - Fixed Width */}
      <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />

      {/* Main Content Area - Flexible */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <TopBar title={getScreenTitle()} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

