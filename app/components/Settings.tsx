'use client'

import { useState } from 'react';
import { User, Bell, Lock, Database, Printer, Scan, Save, LogOut } from 'lucide-react';

interface SettingsProps {
  username: string;
  onLogout: () => void;
}

export function Settings({ username, onLogout }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('profile');
  
  const [profileData, setProfileData] = useState({
    fullName: 'John Doe',
    email: 'john.doe@marblefactory.com',
    phone: '+1 (555) 123-4567',
    role: 'Warehouse Manager',
    department: 'Inventory Management',
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    lowStock: true,
    newOrders: true,
    dailyReport: false,
    weeklyReport: true,
    emailNotifications: true,
    pushNotifications: false,
  });

  const [systemSettings, setSystemSettings] = useState({
    lowStockThreshold: '500',
    autoBackup: true,
    backupFrequency: 'daily',
    dateFormat: 'YYYY-MM-DD',
    currency: 'PKR',
    language: 'en',
  });

  const [scannerSettings, setScannerSettings] = useState({
    scannerEnabled: true,
    autoPopulate: true,
    scanSound: true,
    scanMode: 'continuous',
    barcodeFormat: 'CODE128',
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecurityData({
      ...securityData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNotificationToggle = (key: string) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: !notificationSettings[key as keyof typeof notificationSettings],
    });
  };

  const handleSystemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setSystemSettings({
      ...systemSettings,
      [e.target.name]: value,
    });
  };

  const handleScannerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setScannerSettings({
      ...scannerSettings,
      [e.target.name]: value,
    });
  };

  const handleSaveProfile = () => {
    alert('Profile updated successfully!');
  };

  const handleChangePassword = () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    alert('Password changed successfully!');
    setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'scanner', label: 'Scanner & Barcode', icon: Scan },
    { id: 'system', label: 'System', icon: Database },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-semibold text-[#1F2937]">Settings</h3>
            <p className="text-sm text-gray-600 mt-1">Manage your account and preferences</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-[#DC2626] border border-[#DC2626] rounded-lg hover:bg-[#DC2626] hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#2563EB] text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h4 className="text-lg font-semibold text-[#1F2937] mb-6">Profile Information</h4>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={profileData.fullName}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <input
                          type="text"
                          name="role"
                          value={profileData.role}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                        <input
                          type="text"
                          name="department"
                          value={profileData.department}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h4 className="text-lg font-semibold text-[#1F2937] mb-6">Change Password</h4>
                  
                  <div className="space-y-4 mb-6 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={securityData.currentPassword}
                        onChange={handleSecurityChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={securityData.newPassword}
                        onChange={handleSecurityChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={securityData.confirmPassword}
                        onChange={handleSecurityChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors"
                  >
                    Update Password
                  </button>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h4 className="text-lg font-semibold text-[#1F2937] mb-6">Notification Preferences</h4>
                  
                  <div className="space-y-4">
                    <div className="pb-4 border-b border-gray-200">
                      <h5 className="font-medium text-[#1F2937] mb-3">Alert Notifications</h5>
                      
                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700">Low Stock Alerts</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.lowStock}
                          onChange={() => handleNotificationToggle('lowStock')}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 rounded focus:ring-[#2563EB]"
                        />
                      </label>

                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700">New Order Notifications</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.newOrders}
                          onChange={() => handleNotificationToggle('newOrders')}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 rounded focus:ring-[#2563EB]"
                        />
                      </label>
                    </div>

                    <div className="pb-4 border-b border-gray-200">
                      <h5 className="font-medium text-[#1F2937] mb-3">Report Notifications</h5>
                      
                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700">Daily Reports</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.dailyReport}
                          onChange={() => handleNotificationToggle('dailyReport')}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 rounded focus:ring-[#2563EB]"
                        />
                      </label>

                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700">Weekly Reports</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.weeklyReport}
                          onChange={() => handleNotificationToggle('weeklyReport')}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 rounded focus:ring-[#2563EB]"
                        />
                      </label>
                    </div>

                    <div>
                      <h5 className="font-medium text-[#1F2937] mb-3">Delivery Methods</h5>
                      
                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700">Email Notifications</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailNotifications}
                          onChange={() => handleNotificationToggle('emailNotifications')}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 rounded focus:ring-[#2563EB]"
                        />
                      </label>

                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700">Push Notifications</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.pushNotifications}
                          onChange={() => handleNotificationToggle('pushNotifications')}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 rounded focus:ring-[#2563EB]"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Scanner & Barcode Tab */}
              {activeTab === 'scanner' && (
                <div>
                  <h4 className="text-lg font-semibold text-[#1F2937] mb-6">Scanner & Barcode Settings</h4>
                  
                  <div className="space-y-6">
                    <div className="pb-4 border-b border-gray-200">
                      <h5 className="font-medium text-[#1F2937] mb-3">Scanner Configuration</h5>
                      
                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700">Enable Barcode Scanner</span>
                        <input
                          type="checkbox"
                          name="scannerEnabled"
                          checked={scannerSettings.scannerEnabled}
                          onChange={handleScannerChange}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 rounded focus:ring-[#2563EB]"
                        />
                      </label>

                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700">Auto-populate Form Fields</span>
                        <input
                          type="checkbox"
                          name="autoPopulate"
                          checked={scannerSettings.autoPopulate}
                          onChange={handleScannerChange}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 rounded focus:ring-[#2563EB]"
                        />
                      </label>

                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700">Scan Sound Feedback</span>
                        <input
                          type="checkbox"
                          name="scanSound"
                          checked={scannerSettings.scanSound}
                          onChange={handleScannerChange}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 rounded focus:ring-[#2563EB]"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Scan Mode</label>
                        <select
                          name="scanMode"
                          value={scannerSettings.scanMode}
                          onChange={handleScannerChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        >
                          <option value="continuous">Continuous Scan</option>
                          <option value="single">Single Scan</option>
                          <option value="batch">Batch Scan</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Barcode Format</label>
                        <select
                          name="barcodeFormat"
                          value={scannerSettings.barcodeFormat}
                          onChange={handleScannerChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        >
                          <option value="CODE128">CODE128</option>
                          <option value="CODE39">CODE39</option>
                          <option value="EAN13">EAN-13</option>
                          <option value="EAN8">EAN-8</option>
                          <option value="QR">QR Code</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 font-medium mb-2">💡 Scanner Tips:</p>
                      <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                        <li>Connect your barcode scanner device before scanning</li>
                        <li>Ensure good lighting for optimal scan results</li>
                        <li>Hold scanner 4-6 inches from the barcode</li>
                        <li>Test scanner with the "Test Scan" button below</li>
                      </ul>
                    </div>

                    <button className="px-6 py-2 bg-[#16A34A] text-white rounded-lg hover:bg-[#15803D] transition-colors flex items-center gap-2">
                      <Scan className="w-4 h-4" />
                      Test Scanner
                    </button>
                  </div>
                </div>
              )}

              {/* System Tab */}
              {activeTab === 'system' && (
                <div>
                  <h4 className="text-lg font-semibold text-[#1F2937] mb-6">System Settings</h4>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold (kg)</label>
                        <input
                          type="number"
                          name="lowStockThreshold"
                          value={systemSettings.lowStockThreshold}
                          onChange={handleSystemChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                        <select
                          name="backupFrequency"
                          value={systemSettings.backupFrequency}
                          onChange={handleSystemChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        >
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="manual">Manual Only</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                        <select
                          name="dateFormat"
                          value={systemSettings.dateFormat}
                          onChange={handleSystemChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        >
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                        <select
                          name="currency"
                          value={systemSettings.currency}
                          onChange={handleSystemChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        >
                          <option value="PKR">PKR (₨)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="JPY">JPY (¥)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <select
                          name="language"
                          value={systemSettings.language}
                          onChange={handleSystemChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="it">Italian</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="autoBackup"
                          checked={systemSettings.autoBackup}
                          onChange={handleSystemChange}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 rounded focus:ring-[#2563EB]"
                        />
                        <span className="ml-2 text-gray-700">Enable Automatic Backups</span>
                      </label>
                    </div>

                    <div className="flex gap-4">
                      <button className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Save Settings
                      </button>
                      <button className="px-6 py-2 bg-[#16A34A] text-white rounded-lg hover:bg-[#15803D] transition-colors flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Backup Now
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

