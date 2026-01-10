import { useState } from 'react';
import { Lock, Shield, Clock, AlertTriangle, Smartphone, Mail, Key, Eye, EyeOff, Save, X } from 'lucide-react';

interface LoginHistoryItem {
  id: string;
  device: string;
  location: string;
  ip: string;
  timestamp: string;
  status: 'success' | 'failed';
}

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

const mockLoginHistory: LoginHistoryItem[] = [
  {
    id: '1',
    device: 'Windows PC - Chrome',
    location: 'New York, USA',
    ip: '192.168.1.100',
    timestamp: '2026-01-09 09:15 AM',
    status: 'success',
  },
  {
    id: '2',
    device: 'Windows PC - Chrome',
    location: 'New York, USA',
    ip: '192.168.1.100',
    timestamp: '2026-01-08 08:30 AM',
    status: 'success',
  },
  {
    id: '3',
    device: 'Mobile - Safari',
    location: 'Brooklyn, USA',
    ip: '192.168.1.105',
    timestamp: '2026-01-07 06:45 PM',
    status: 'failed',
  },
  {
    id: '4',
    device: 'Windows PC - Chrome',
    location: 'New York, USA',
    ip: '192.168.1.100',
    timestamp: '2026-01-07 09:00 AM',
    status: 'success',
  },
];

const mockActiveSessions: ActiveSession[] = [
  {
    id: '1',
    device: 'Windows PC',
    browser: 'Chrome 120.0',
    location: 'New York, USA',
    ip: '192.168.1.100',
    lastActive: '2026-01-09 09:15 AM',
    current: true,
  },
  {
    id: '2',
    device: 'Windows PC',
    browser: 'Edge 120.0',
    location: 'New York, USA',
    ip: '192.168.1.100',
    lastActive: '2026-01-08 02:30 PM',
    current: false,
  },
];

export function SecuritySettings() {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangePassword = () => {
    if (!passwordData.currentPassword) {
      alert('Please enter your current password!');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      alert('New password must be at least 8 characters long!');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    alert('Password changed successfully!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordForm(false);
  };

  const handleEnable2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    if (!twoFactorEnabled) {
      alert('Two-factor authentication enabled! You will receive a setup code.');
    } else {
      alert('Two-factor authentication disabled!');
    }
  };

  const handleTerminateSession = (sessionId: string) => {
    if (confirm('Are you sure you want to terminate this session?')) {
      alert('Session terminated successfully!');
    }
  };

  const handleTerminateAllSessions = () => {
    if (confirm('Are you sure you want to terminate all other sessions?')) {
      alert('All other sessions terminated successfully!');
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 8) return { strength: 25, label: 'Weak', color: 'bg-red-500' };
    if (password.length < 12) return { strength: 50, label: 'Fair', color: 'bg-orange-500' };
    if (password.length < 16) return { strength: 75, label: 'Good', color: 'bg-yellow-500' };
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-[#1F2937] dark:text-white">Security Settings</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your account security, passwords, and authentication settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Password Management */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-[#2563EB] dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-[#1F2937] dark:text-white">Password Management</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Update your account password</p>
                  </div>
                </div>
                {!showPasswordForm && (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="px-4 py-2 bg-[#2563EB] dark:bg-blue-600 text-white rounded-lg hover:bg-[#1E40AF] dark:hover:bg-blue-700 transition-colors"
                  >
                    Change Password
                  </button>
                )}
              </div>

              {showPasswordForm ? (
                <div className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter current password"
                        className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password"
                        className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {/* Password Strength Indicator */}
                    {passwordData.newPassword && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Password Strength</span>
                          <span className={`text-xs font-medium ${
                            passwordStrength.strength === 100 ? 'text-green-600 dark:text-green-400' :
                            passwordStrength.strength >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${passwordStrength.color}`}
                            style={{ width: `${passwordStrength.strength}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  {/* Password Requirements */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Password Requirements:</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <li className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${passwordData.newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        At least 8 characters
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        At least one uppercase letter
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        At least one lowercase letter
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        At least one number
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[^A-Za-z0-9]/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        At least one special character
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleChangePassword}
                      className="px-6 py-3 bg-[#16A34A] dark:bg-green-600 text-white rounded-lg hover:bg-[#15803D] dark:hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
                    >
                      <Save className="w-4 h-4" />
                      Update Password
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="mb-2">
                    <span className="font-medium">Last changed:</span> January 5, 2026
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    It's recommended to change your password every 90 days for security.
                  </p>
                </div>
              )}
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-[#1F2937] dark:text-white">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  <Shield className={`w-5 h-5 ${twoFactorEnabled ? 'text-[#16A34A] dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {twoFactorEnabled ? 'Your account is protected with 2FA' : 'Enable 2FA for better security'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleEnable2FA}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    twoFactorEnabled
                      ? 'bg-red-50 dark:bg-red-900/20 text-[#DC2626] dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                      : 'bg-[#2563EB] dark:bg-blue-600 text-white hover:bg-[#1E40AF] dark:hover:bg-blue-700'
                  }`}
                >
                  {twoFactorEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>

              {twoFactorEnabled && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Key className="w-4 h-4" />
                    <span>Backup codes: 8 remaining</span>
                  </div>
                  <button className="text-sm text-[#2563EB] dark:text-blue-400 hover:text-[#1E40AF] dark:hover:text-blue-300 font-medium">
                    View backup codes
                  </button>
                </div>
              )}
            </div>

            {/* Active Sessions */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#16A34A] dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-[#1F2937] dark:text-white">Active Sessions</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your active login sessions</p>
                  </div>
                </div>
                <button
                  onClick={handleTerminateAllSessions}
                  className="px-4 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-[#DC2626] dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
                >
                  Terminate All Others
                </button>
              </div>

              <div className="space-y-3">
                {mockActiveSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {session.device} • {session.browser}
                        </p>
                        {session.current && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-medium rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {session.location} • {session.ip}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last active: {session.lastActive}</p>
                    </div>
                    {!session.current && (
                      <button
                        onClick={() => handleTerminateSession(session.id)}
                        className="ml-4 p-2 text-[#DC2626] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Login History */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#F59E0B] dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-[#1F2937] dark:text-white">Recent Login History</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Recent login attempts on your account</p>
                </div>
              </div>

              <div className="space-y-3">
                {mockLoginHistory.map((login) => (
                  <div
                    key={login.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{login.device}</p>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            login.status === 'success'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                          }`}
                        >
                          {login.status === 'success' ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {login.location} • {login.ip}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{login.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 sticky top-8 space-y-6">
              {/* Security Preferences */}
              <div>
                <h4 className="font-semibold text-[#1F2937] dark:text-white mb-4">Security Preferences</h4>
                
                <div className="space-y-4">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Email Alerts</span>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        emailNotifications ? 'bg-[#2563EB] dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Login Alerts */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Login Alerts</span>
                    </div>
                    <button
                      onClick={() => setLoginAlerts(!loginAlerts)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        loginAlerts ? 'bg-[#2563EB] dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          loginAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Session Timeout */}
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      Session Timeout
                    </label>
                    <select
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-gray-800 dark:text-white"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Security Status */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Security Status</h5>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Password Strength</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">Strong</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">2FA Status</span>
                    <span className={`font-medium ${twoFactorEnabled ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Active Sessions</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{mockActiveSessions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Last Password Change</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">4 days ago</span>
                  </div>
                </div>
              </div>

              {/* Security Tips */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Security Tips</h5>
                <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-[#2563EB] dark:bg-blue-400 rounded-full mt-1.5" />
                    <span>Use a unique password for this account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-[#2563EB] dark:bg-blue-400 rounded-full mt-1.5" />
                    <span>Enable two-factor authentication</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-[#2563EB] dark:bg-blue-400 rounded-full mt-1.5" />
                    <span>Review active sessions regularly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-[#2563EB] dark:bg-blue-400 rounded-full mt-1.5" />
                    <span>Never share your password</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

