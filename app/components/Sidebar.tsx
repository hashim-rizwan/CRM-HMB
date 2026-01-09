'use client'

import { Package, Plus, Minus, BarChart3, ArrowLeftRight, Bell, Settings as SettingsIcon, Users, Scan } from 'lucide-react';

interface SidebarProps {
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
}

export function Sidebar({ activeScreen, setActiveScreen }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Inventory Dashboard', icon: Package },
    { id: 'manage-stock', label: 'Manage Stock', icon: ArrowLeftRight },
    { id: 'barcodes', label: 'Barcode Management', icon: Scan },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'report', label: 'Monthly Usage Report', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="w-60 bg-[#800020] text-white flex flex-col h-screen">
      {/* Logo/Brand */}
      <div className="px-6 py-6 border-b border-[#6B0019]">
        <h1 className="text-xl font-semibold">Marble Factory</h1>
        <p className="text-sm text-red-200 mt-1">Inventory System</p>
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
                      ? 'bg-[#6B0019] text-white'
                      : 'text-red-100 hover:bg-[#990025]'
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
      <div className="px-6 py-4 border-t border-[#6B0019]">
        <p className="text-xs text-red-200">© 2026 Marble Factory</p>
      </div>
    </div>
  );
}

