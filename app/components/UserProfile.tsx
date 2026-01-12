import { useState } from 'react';
import { User, Mail, Phone, Briefcase, Shield, Lock, LogOut, Save, Edit, X } from 'lucide-react';

interface UserProfileProps {
  username: string;
  onLogout: () => void;
}

export function UserProfile({ username, onLogout }: UserProfileProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileData, setProfileData] = useState({
    fullName: 'John Doe',
    username: username,
    email: 'john.doe@marblefactory.com',
    phone: '+1 (555) 123-4567',
    role: 'Warehouse Manager',
    department: 'Inventory Management',
    joinedDate: 'January 15, 2025',
  });

  const [editedProfileData, setEditedProfileData] = useState({ ...profileData });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedProfileData({
      ...editedProfileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = () => {
    setProfileData(editedProfileData);
    setIsEditingProfile(false);
    alert('Profile updated successfully!');
  };

  const handleCancelProfileEdit = () => {
    setEditedProfileData({ ...profileData });
    setIsEditingProfile(false);
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
    setIsEditingPassword(false);
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-[#1F2937]">User Profile</h3>
          <p className="text-sm text-gray-600 mt-1">Manage your account information and security</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h4 className="text-lg font-semibold text-[#1F2937] mb-6">Profile Information</h4>

              <div className="space-y-6">
                {/* Avatar & Name */}
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-[#2563EB] rounded-full flex items-center justify-center text-white text-3xl font-semibold">
                    {profileData.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#1F2937]">{profileData.fullName}</h3>
                    <p className="text-sm text-gray-600 mt-1">@{profileData.username}</p>
                    <p className="text-sm text-[#2563EB] font-medium mt-1">{profileData.role}</p>
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editedProfileData.email}
                      onChange={handleProfileEdit}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      disabled={!isEditingProfile}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={editedProfileData.phone}
                      onChange={handleProfileEdit}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      disabled={!isEditingProfile}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Briefcase className="w-4 h-4" />
                      Department
                    </label>
                    <p className="text-sm text-gray-900">{profileData.department}</p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Shield className="w-4 h-4" />
                      Account Type
                    </label>
                    <p className="text-sm text-gray-900">{profileData.role}</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4" />
                      Member Since
                    </label>
                    <p className="text-sm text-gray-900">{profileData.joinedDate}</p>
                  </div>
                </div>
              </div>

              {isEditingProfile && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    className="px-6 py-3 bg-[#16A34A] text-white rounded-lg hover:bg-[#15803D] transition-colors flex items-center gap-2 font-medium"
                  >
                    <Save className="w-4 h-4" />
                    Save Profile
                  </button>
                  <button
                    onClick={handleCancelProfileEdit}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold text-[#1F2937]">Security Settings</h4>
                {!isEditingPassword && (
                  <button
                    onClick={() => setIsEditingPassword(true)}
                    className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Change Password
                  </button>
                )}
              </div>

              {isEditingPassword ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleChangePassword}
                      className="px-6 py-3 bg-[#16A34A] text-white rounded-lg hover:bg-[#15803D] transition-colors flex items-center gap-2 font-medium"
                    >
                      <Save className="w-4 h-4" />
                      Save Password
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingPassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  <p>Password last changed: January 5, 2026</p>
                  <p className="mt-2 text-xs text-gray-500">
                    Use a strong password with at least 8 characters, including uppercase, lowercase,
                    numbers, and special characters.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h4 className="font-semibold text-[#1F2937] mb-4">Quick Actions</h4>

              <div className="space-y-3">
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>

                <button className="w-full px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium">
                  <Shield className="w-4 h-4" />
                  Security Settings
                </button>

                <button
                  onClick={onLogout}
                  className="w-full px-4 py-3 bg-red-50 text-[#DC2626] rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>

              {/* Account Stats */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Account Activity</h5>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Login</span>
                    <span className="text-gray-900 font-medium">Today, 9:15 AM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Login Count</span>
                    <span className="text-gray-900 font-medium">342 times</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Account Status</span>
                    <span className="text-[#16A34A] font-medium">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

