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
import { UserProfile } from './components/UserProfile'
import { TransactionHistory } from './components/TransactionHistory'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [userRole, setUserRole] = useState<'Admin' | 'Staff'>('Staff')
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [darkMode, setDarkMode] = useState(false)

  // Load dark mode preference only (no auto-login on restart)
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    
    // Load dark mode preference
    if (savedDarkMode === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const handleLogin = (user: string, userData?: any) => {
    setUsername(user)
    setIsAuthenticated(true)
    localStorage.setItem('username', user)
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData))
      // Set user role
      if (userData.role === 'Admin' || userData.role === 'Staff') {
        setUserRole(userData.role)
      }
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUsername('')
    setUserRole('Staff')
    localStorage.removeItem('username')
    localStorage.removeItem('userData')
  }

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', String(newDarkMode))
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
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
      case 'transaction-history':
        return 'Transaction History'
      case 'users':
        return 'User Management'
      case 'user-profile':
        return 'User Profile'
      case 'settings':
        return 'Settings'
      default:
        return 'Inventory Dashboard'
    }
  }

  // Prevent Staff from accessing User Management
  useEffect(() => {
    if (userRole === 'Staff' && activeScreen === 'users') {
      setActiveScreen('dashboard')
    }
  }, [userRole, activeScreen])

  const renderContent = () => {
    // Staff cannot access User Management
    if (userRole === 'Staff' && activeScreen === 'users') {
      return <InventoryDashboard searchQuery={searchQuery} userRole={userRole} />
    }

    switch (activeScreen) {
      case 'dashboard':
        return <InventoryDashboard searchQuery={searchQuery} userRole={userRole} />
      case 'manage-stock':
        return <ManageStock searchQuery={searchQuery} userRole={userRole} />
      case 'barcodes':
        return <BarcodeManagement />
      case 'notifications':
        return <Notifications />
      case 'report':
        return <MonthlyReport searchQuery={searchQuery} />
      case 'transaction-history':
        return <TransactionHistory />
      case 'users':
        return <UserManagement />
      case 'user-profile':
        return <UserProfile username={username} onLogout={handleLogout} />
      case 'settings':
        return <Settings username={username} onLogout={handleLogout} />
      default:
        return <InventoryDashboard searchQuery={searchQuery} userRole={userRole} />
    }
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-black overflow-hidden">
      {/* Sidebar - Fixed Width */}
      <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} darkMode={darkMode} userRole={userRole} />

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
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          showSearch={activeScreen === 'dashboard'}
        />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-[#F9FAFB] dark:bg-black">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

