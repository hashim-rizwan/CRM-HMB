'use client'

import Image from 'next/image';
import { Package, Plus, Minus, BarChart3, ArrowLeftRight, Bell, Settings as SettingsIcon, Users, Scan, User, History, Bookmark, FileText } from 'lucide-react';

interface SidebarProps {
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  darkMode?: boolean;
  userRole?: 'Admin' | 'Staff';
  sidebarOpen?: boolean;
}

export function Sidebar({ activeScreen, setActiveScreen, darkMode = false, userRole = 'Staff', sidebarOpen = false }: SidebarProps) {
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
    { id: 'api-docs', label: 'API Documentation', icon: FileText, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  // Filter menu items - Staff cannot see User Management
  const menuItems = allMenuItems.filter(item => !item.adminOnly || userRole === 'Admin');

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#661B0F] text-white flex flex-col h-screen transition-transform duration-300 md:relative md:translate-x-0 md:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Logo/Brand */}
      <div className="px-4 py-5 border-b border-[#4D140B]">
        <div className="mb-3">
          <Image
            src="/images/haqeeq-logo.png"
            alt="Haqeeq Marbles"
            width={280}
            height={112}
            className="h-14 w-full object-contain object-left"
            priority
          />
        </div>
        <h1 className="text-lg font-semibold leading-tight">Haqeeq Marbles</h1>
        <p className="text-sm text-red-100 mt-0.5">Inventory System</p>
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

