'use client'

import { Package, Plus, Minus, BarChart3, ArrowLeftRight, Bell, Settings as SettingsIcon, Users, Scan, User, History, Bookmark } from 'lucide-react';

interface SidebarProps {
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  darkMode?: boolean;
  userRole?: 'Admin' | 'Staff';
}

export function Sidebar({ activeScreen, setActiveScreen, darkMode = false, userRole = 'Staff' }: SidebarProps) {
  const allMenuItems = [
    { id: 'dashboard', label: 'Inventory Dashboard', icon: Package },
    { id: 'manage-stock', label: 'Manage Stock', icon: ArrowLeftRight },
    { id: 'barcodes', label: 'Barcode Management', icon: Scan },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'report', label: 'Monthly Usage Report', icon: BarChart3 },
    { id: 'transaction-history', label: 'Transaction History', icon: History },
    { id: 'reserved-stock', label: 'Reserved Stock', icon: Bookmark },
    { id: 'users', label: 'User Management', icon: Users, adminOnly: true },
    { id: 'user-profile', label: 'User Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  // Filter menu items - Staff cannot see User Management
  const menuItems = allMenuItems.filter(item => !item.adminOnly || userRole === 'Admin');

  return (
    <div className="w-60 bg-[#661B0F] text-white flex flex-col h-screen">
      {/* Logo/Brand */}
      <div className="px-6 py-6 border-b border-[#4D140B]">
        <h1 className="text-xl font-semibold">Haqeeq Marbles</h1>
        <p className="text-sm text-red-100 mt-1">Inventory System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveScreen(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#4D140B] text-white'
                      : 'text-red-50 hover:bg-[#7A2215]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#4D140B]">
        <p className="text-xs text-red-100">© 2026 Haqeeq Marbles</p>
      </div>
    </div>
  );
}

