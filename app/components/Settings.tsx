'use client'

import { useState, useEffect, useRef } from 'react';
import { User, Bell, Lock, Database, Printer, Scan, Save, LogOut, Download, Upload } from 'lucide-react';
import { userAPI, authAPI, backupAPI } from '@/lib/api';

interface SettingsProps {
  username: string;
  onLogout: () => void;
}

export function Settings({ username, onLogout }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    department: '',
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [showBackupConfirm, setShowBackupConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      
      setLoading(true);
      setError(null);
      try {
        const response = await userAPI.getProfile(username);
        if (response.success && response.user) {
          setProfileData({
            fullName: response.user.fullName || '',
            email: response.user.email || '',
            phone: response.user.phone || '',
            role: response.user.role || '',
            department: response.user.department || '',
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  const handleSaveProfile = async () => {
    if (!username) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await userAPI.updateProfile(username, {
        fullName: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
        role: profileData.role,
        department: profileData.department,
      });

      if (response.success) {
        setSuccessMessage('Profile updated successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Reset messages
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validation: Check if all fields are filled
    if (!securityData.currentPassword || !securityData.newPassword || !securityData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    // Validation: Check if new password and confirm password match
    if (securityData.newPassword !== securityData.confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    // Validation: Check if new password is not empty
    if (securityData.newPassword.length === 0) {
      setPasswordError('New password cannot be empty');
      return;
    }

    setChangingPassword(true);
    setPasswordError(null);

    try {
      const response = await authAPI.changePassword(
        username,
        securityData.currentPassword,
        securityData.newPassword
      );

      if (response.success) {
        setPasswordSuccess('Password changed successfully!');
        setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        // Clear success message after 3 seconds
        setTimeout(() => setPasswordSuccess(null), 3000);
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleBackupClick = () => {
    setShowBackupConfirm(true);
  };

  const handleBackup = async () => {
    setShowBackupConfirm(false);
    setBackingUp(true);
    setBackupMessage(null);

    try {
      // Check if running in Electron by checking for the backup API
      // Try multiple ways to detect Electron
      const electron = (window as any).electron;
      const hasElectronAPI = electron && electron.backup && electron.backup.saveDialog;
      
      if (hasElectronAPI) {
        // Use Electron native dialog
        const dialogResult = await electron.backup.saveDialog();
        
        if (dialogResult.canceled) {
          setBackingUp(false);
          return;
        }

        // Check if there's an error (e.g., not external drive)
        if (dialogResult.error) {
          setBackupMessage(`Error: ${dialogResult.error}`);
          setBackingUp(false);
          return;
        }

        // Fetch backup data
        const response = await fetch('/api/backup/export');
        if (!response.ok) {
          throw new Error('Failed to create backup');
        }
        const backupData = await response.text();

        // Write file using Electron
        const writeResult = await electron.backup.writeFile(
          dialogResult.filePath,
          backupData
        );

        if (writeResult.success) {
          setBackupMessage('Backup created successfully! File saved to external drive.');
        } else {
          throw new Error(writeResult.error || 'Failed to save backup file');
        }
      } else {
        // Web browser fallback - use File System Access API if available, otherwise download
        try {
          // Try File System Access API (Chrome/Edge)
          if ('showSaveFilePicker' in window) {
            const fileHandle = await (window as any).showSaveFilePicker({
              suggestedName: `haqeeq-marbles-backup-${new Date().toISOString().split('T')[0]}.json`,
              types: [{
                description: 'JSON Files',
                accept: { 'application/json': ['.json'] }
              }]
            });

            // Fetch backup data
            const response = await fetch('/api/backup/export');
            if (!response.ok) {
              throw new Error('Failed to create backup');
            }
            const backupData = await response.text();

            // Write to file
            const writable = await fileHandle.createWritable();
            await writable.write(backupData);
            await writable.close();

            setBackupMessage('Backup created successfully! Please ensure the file is saved to an external drive.');
          } else {
            // Fallback to browser download
            const blob = await backupAPI.export();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `haqeeq-marbles-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setBackupMessage('Backup file downloaded. Please save it to an external drive.');
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            // User cancelled
            setBackingUp(false);
            return;
          }
          throw err;
        }
      }
      
      setTimeout(() => setBackupMessage(null), 5000);
    } catch (err: any) {
      setBackupMessage(`Error: ${err.message || 'Failed to create backup'}`);
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestoreClick = () => {
    setShowRestoreConfirm(true);
  };

  const handleRestore = async () => {
    setShowRestoreConfirm(false);
    setRestoring(true);
    setBackupMessage(null);

    try {
      // Check if running in Electron
      const electron = (window as any).electron;
      const isElectron = electron && electron.backup && electron.backup.openDialog;
      
      if (isElectron) {
        // Use Electron native dialog
        const dialogResult = await electron.backup.openDialog();
        
        if (dialogResult.canceled) {
          setRestoring(false);
          return;
        }

        if (dialogResult.error) {
          setBackupMessage(`Error: ${dialogResult.error}`);
          setRestoring(false);
          return;
        }

        // Parse and restore backup
        const backup = JSON.parse(dialogResult.data);
        const result = await backupAPI.restoreFromData(backup);

        if (result.success) {
          setBackupMessage('Backup restored successfully! Please refresh the page.');
        }
      } else {
        // Web browser fallback - use File System Access API if available, otherwise file input
        try {
          if ('showOpenFilePicker' in window) {
            // Use File System Access API (Chrome/Edge)
            const [fileHandle] = await (window as any).showOpenFilePicker({
              types: [{
                description: 'JSON Files',
                accept: { 'application/json': ['.json'] }
              }],
              multiple: false
            });

            const file = await fileHandle.getFile();
            const text = await file.text();
            const backup = JSON.parse(text);

            const result = await backupAPI.restoreFromData(backup);
            if (result.success) {
              setBackupMessage('Backup restored successfully! Please refresh the page.');
            }
          } else {
            // Fallback to file input
            fileInputRef.current?.click();
            // The handleFileSelect will be called when user selects a file
            setRestoring(false); // Reset here, will be set to true in handleFileSelect
            return;
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            // User cancelled
            setRestoring(false);
            return;
          }
          throw err;
        }
      }
    } catch (err: any) {
      setBackupMessage(`Error: ${err.message || 'Failed to restore backup'}`);
      setRestoring(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      setBackupMessage('Error: Please select a valid backup file (.json)');
      return;
    }

    setRestoring(true);
    setBackupMessage(null);

    try {
      const result = await backupAPI.restore(file);
      if (result.success) {
        setBackupMessage('Backup restored successfully! Please refresh the page.');
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err: any) {
      setBackupMessage(`Error: ${err.message || 'Failed to restore backup'}`);
    } finally {
      setRestoring(false);
    }
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
            <h3 className="text-xl font-semibold text-[#1F2937] dark:text-white">Settings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your account and preferences</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-[#DC2626] dark:text-red-400 border border-[#DC2626] dark:border-red-600 rounded-lg hover:bg-[#DC2626] dark:hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#2563EB] text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
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
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h4 className="text-lg font-semibold text-[#1F2937] dark:text-white mb-6">Profile Information</h4>
                  
                  {loading && (
                    <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">Loading profile...</div>
                  )}

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  {successMessage && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
                      {successMessage}
                    </div>
                  )}
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={profileData.fullName}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                        <input
                          type="text"
                          name="role"
                          value={profileData.role}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
                        <input
                          type="text"
                          name="department"
                          value={profileData.department}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={saving || loading}
                    className="px-6 py-2 bg-[#2563EB] dark:bg-blue-600 text-white rounded-lg hover:bg-[#1E40AF] dark:hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h4 className="text-lg font-semibold text-[#1F2937] dark:text-white mb-6">Change Password</h4>
                  
                  {passwordError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
                      {passwordSuccess}
                    </div>
                  )}
                  
                  <div className="space-y-4 mb-6 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={securityData.currentPassword}
                        onChange={handleSecurityChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                        placeholder="Enter your current password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={securityData.newPassword}
                        onChange={handleSecurityChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white ${
                          securityData.confirmPassword && securityData.newPassword !== securityData.confirmPassword
                            ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 dark:border-gray-700 focus:ring-[#2563EB]'
                        }`}
                        placeholder="Enter your new password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={securityData.confirmPassword}
                        onChange={handleSecurityChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white ${
                          securityData.confirmPassword && securityData.newPassword !== securityData.confirmPassword
                            ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                            : securityData.confirmPassword && securityData.newPassword === securityData.confirmPassword
                            ? 'border-green-500 dark:border-green-500 focus:ring-green-500'
                            : 'border-gray-300 dark:border-gray-700 focus:ring-[#2563EB]'
                        }`}
                        placeholder="Confirm your new password"
                      />
                      {securityData.confirmPassword && securityData.newPassword !== securityData.confirmPassword && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">Passwords do not match</p>
                      )}
                      {securityData.confirmPassword && securityData.newPassword === securityData.confirmPassword && securityData.newPassword.length > 0 && (
                        <p className="text-xs text-green-500 dark:text-green-400 mt-1">Passwords match</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="px-6 py-2 bg-[#2563EB] dark:bg-blue-600 text-white rounded-lg hover:bg-[#1E40AF] dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h4 className="text-lg font-semibold text-[#1F2937] dark:text-white mb-6">Notification Preferences</h4>
                  
                  <div className="space-y-4">
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                      <h5 className="font-medium text-[#1F2937] dark:text-white mb-3">Alert Notifications</h5>
                      
                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700 dark:text-gray-300">Low Stock Alerts</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.lowStock}
                          onChange={() => handleNotificationToggle('lowStock')}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 dark:border-gray-600 rounded focus:ring-[#2563EB] dark:bg-gray-800 dark:checked:bg-[#2563EB]"
                        />
                      </label>

                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700 dark:text-gray-300">New Order Notifications</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.newOrders}
                          onChange={() => handleNotificationToggle('newOrders')}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 dark:border-gray-600 rounded focus:ring-[#2563EB] dark:bg-gray-800 dark:checked:bg-[#2563EB]"
                        />
                      </label>
                    </div>

                    <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                      <h5 className="font-medium text-[#1F2937] dark:text-white mb-3">Report Notifications</h5>
                      
                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700 dark:text-gray-300">Daily Reports</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.dailyReport}
                          onChange={() => handleNotificationToggle('dailyReport')}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 dark:border-gray-600 rounded focus:ring-[#2563EB] dark:bg-gray-800 dark:checked:bg-[#2563EB]"
                        />
                      </label>

                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700 dark:text-gray-300">Weekly Reports</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.weeklyReport}
                          onChange={() => handleNotificationToggle('weeklyReport')}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 dark:border-gray-600 rounded focus:ring-[#2563EB] dark:bg-gray-800 dark:checked:bg-[#2563EB]"
                        />
                      </label>
                    </div>

                    <div>
                      <h5 className="font-medium text-[#1F2937] dark:text-white mb-3">Delivery Methods</h5>
                      
                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700 dark:text-gray-300">Email Notifications</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailNotifications}
                          onChange={() => handleNotificationToggle('emailNotifications')}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 dark:border-gray-600 rounded focus:ring-[#2563EB] dark:bg-gray-800 dark:checked:bg-[#2563EB]"
                        />
                      </label>

                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700 dark:text-gray-300">Push Notifications</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.pushNotifications}
                          onChange={() => handleNotificationToggle('pushNotifications')}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 dark:border-gray-600 rounded focus:ring-[#2563EB] dark:bg-gray-800 dark:checked:bg-[#2563EB]"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Scanner & Barcode Tab */}
              {activeTab === 'scanner' && (
                <div>
                  <h4 className="text-lg font-semibold text-[#1F2937] dark:text-white mb-6">Scanner & Barcode Settings</h4>
                  
                  <div className="space-y-6">
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                      <h5 className="font-medium text-[#1F2937] dark:text-white mb-3">Scanner Configuration</h5>
                      
                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700 dark:text-gray-300">Enable Barcode Scanner</span>
                        <input
                          type="checkbox"
                          name="scannerEnabled"
                          checked={scannerSettings.scannerEnabled}
                          onChange={handleScannerChange}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 dark:border-gray-600 rounded focus:ring-[#2563EB] dark:bg-gray-800 dark:checked:bg-[#2563EB]"
                        />
                      </label>

                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700 dark:text-gray-300">Auto-populate Form Fields</span>
                        <input
                          type="checkbox"
                          name="autoPopulate"
                          checked={scannerSettings.autoPopulate}
                          onChange={handleScannerChange}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 dark:border-gray-600 rounded focus:ring-[#2563EB] dark:bg-gray-800 dark:checked:bg-[#2563EB]"
                        />
                      </label>

                      <label className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-gray-700 dark:text-gray-300">Scan Sound Feedback</span>
                        <input
                          type="checkbox"
                          name="scanSound"
                          checked={scannerSettings.scanSound}
                          onChange={handleScannerChange}
                          className="w-5 h-5 text-[#2563EB] border-gray-300 dark:border-gray-600 rounded focus:ring-[#2563EB] dark:bg-gray-800 dark:checked:bg-[#2563EB]"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scan Mode</label>
                        <select
                          name="scanMode"
                          value={scannerSettings.scanMode}
                          onChange={handleScannerChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                        >
                          <option value="continuous">Continuous Scan</option>
                          <option value="single">Single Scan</option>
                          <option value="batch">Batch Scan</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Barcode Format</label>
                        <select
                          name="barcodeFormat"
                          value={scannerSettings.barcodeFormat}
                          onChange={handleScannerChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                        >
                          <option value="CODE128">CODE128</option>
                          <option value="CODE39">CODE39</option>
                          <option value="EAN13">EAN-13</option>
                          <option value="EAN8">EAN-8</option>
                          <option value="QR">QR Code</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">💡 Scanner Tips:</p>
                      <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 ml-4 list-disc">
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
                  <h4 className="text-lg font-semibold text-[#1F2937] dark:text-white mb-6">System Settings</h4>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Low Stock Threshold (kg)</label>
                        <input
                          type="number"
                          name="lowStockThreshold"
                          value={systemSettings.lowStockThreshold}
                          onChange={handleSystemChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Backup Frequency</label>
                        <select
                          name="backupFrequency"
                          value={systemSettings.backupFrequency}
                          onChange={handleSystemChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                        >
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="manual">Manual Only</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Format</label>
                        <select
                          name="dateFormat"
                          value={systemSettings.dateFormat}
                          onChange={handleSystemChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                        >
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                        <select
                          name="currency"
                          value={systemSettings.currency}
                          onChange={handleSystemChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                        >
                          <option value="PKR">PKR (₨)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="JPY">JPY (¥)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                        <select
                          name="language"
                          value={systemSettings.language}
                          onChange={handleSystemChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
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
                          className="w-5 h-5 text-[#2563EB] border-gray-300 dark:border-gray-600 rounded focus:ring-[#2563EB] dark:bg-gray-800 dark:checked:bg-[#2563EB]"
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">Enable Automatic Backups</span>
                      </label>
                    </div>

                    {backupMessage && (
                      <div className={`p-3 rounded-lg text-sm ${
                        backupMessage.includes('Error') || backupMessage.includes('failed')
                          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                          : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                      }`}>
                        {backupMessage}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button className="px-6 py-2 bg-[#2563EB] dark:bg-blue-600 text-white rounded-lg hover:bg-[#1E40AF] dark:hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Save Settings
                      </button>
                      <button
                        onClick={handleBackupClick}
                        disabled={backingUp}
                        className="px-6 py-2 bg-[#16A34A] dark:bg-green-600 text-white rounded-lg hover:bg-[#15803D] dark:hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download className="w-4 h-4" />
                        {backingUp ? 'Creating Backup...' : 'Backup Now'}
                      </button>
                      <button
                        onClick={handleRestoreClick}
                        disabled={restoring}
                        className="px-6 py-2 bg-[#DC2626] dark:bg-red-600 text-white rounded-lg hover:bg-[#B91C1C] dark:hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-4 h-4" />
                        {restoring ? 'Restoring...' : 'Restore Backup'}
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backup Confirmation Modal */}
      {showBackupConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-[#1F2937] dark:text-white mb-4">Create Backup</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
              <strong className="text-red-600 dark:text-red-400">IMPORTANT:</strong> Please ensure you have plugged in an external drive.
              <br /><br />
              You will be asked to choose where to save the backup file. <strong>Backup files can only be saved to external storage devices.</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleBackup}
                className="flex-1 px-4 py-2 bg-[#16A34A] dark:bg-green-600 text-white rounded-lg hover:bg-[#15803D] dark:hover:bg-green-700 transition-colors"
              >
                Proceed
              </button>
              <button
                onClick={() => setShowBackupConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-[#1F2937] dark:text-white mb-4">Restore Backup</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
              <strong className="text-red-600 dark:text-red-400">WARNING:</strong> This will replace ALL current data with the backup data.
              <br /><br />
              <strong className="text-red-600 dark:text-red-400">IMPORTANT:</strong> Please ensure you have plugged in your external drive with the backup file.
              <br /><br />
              <strong>Please select the backup file from an external storage device.</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRestore}
                className="flex-1 px-4 py-2 bg-[#DC2626] dark:bg-red-600 text-white rounded-lg hover:bg-[#B91C1C] dark:hover:bg-red-700 transition-colors"
              >
                Proceed
              </button>
              <button
                onClick={() => setShowRestoreConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

