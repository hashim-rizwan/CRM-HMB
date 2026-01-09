'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { InventoryDashboard } from './components/InventoryDashboard'
import { ManageStock } from './components/ManageStock'
import { MonthlyReport } from './components/MonthlyReport'
import { Notifications } from './components/Notifications'
import { BarcodeManagement } from './components/BarcodeManagement'
import { UserManagement } from './components/UserManagement'
import { Settings } from './components/Settings'
import { Login } from './components/Login'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const savedUsername = localStorage.getItem('username')
    if (savedUsername) {
      setUsername(savedUsername)
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (user: string) => {
    setUsername(user)
    setIsAuthenticated(true)
    localStorage.setItem('username', user)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUsername('')
    localStorage.removeItem('username')
  }

  const getScreenTitle = () => {
    switch (activeScreen) {
      case 'dashboard':
        return 'Inventory Dashboard'
      case 'manage-stock':
        return 'Manage Stock'
      case 'barcodes':
        return 'Barcode Management'
      case 'notifications':
        return 'Notifications'
      case 'report':
        return 'Monthly Usage Report'
      case 'users':
        return 'User Management'
      case 'settings':
        return 'Settings'
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
      case 'barcodes':
        return <BarcodeManagement />
      case 'notifications':
        return <Notifications />
      case 'report':
        return <MonthlyReport searchQuery={searchQuery} />
      case 'users':
        return <UserManagement />
      case 'settings':
        return <Settings username={username} onLogout={handleLogout} />
      default:
        return <InventoryDashboard searchQuery={searchQuery} />
    }
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      {/* Sidebar - Fixed Width */}
      <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />

      {/* Main Content Area - Flexible */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <TopBar 
          title={getScreenTitle()} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery}
          username={username}
          onLogout={handleLogout}
          onNavigateToNotifications={() => setActiveScreen('notifications')}
          unreadNotificationCount={2}
        />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

