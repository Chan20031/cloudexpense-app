import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useContext(AuthContext);
  const [username, setUsername] = useState(user?.name || '');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [capsLock, setCapsLock] = useState({ current: false, new: false, confirm: false });
  const [passwordStrength, setPasswordStrength] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [profilePic, setProfilePic] = useState(user?.profile_picture || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (v) => v.length >= 8 },
    { label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
    { label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
    { label: 'One number', test: (v) => /[0-9]/.test(v) },
    { label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
  ];

  useEffect(() => {
    if (user?.name) {
      setUsername(user.name);
    }
  }, [user]);

  // Always sync profilePic with user.profile_picture and fetch URL if needed
  useEffect(() => {
    const fetchProfilePictureUrl = async () => {
      if (!user?.profile_picture) {
        console.log('No profile picture in user data, clearing profilePic');
        setProfilePic(null);
        return;
      }

      // If it's already a URL, use it directly
      if (user.profile_picture.startsWith('http')) {
        console.log('Profile picture is already a URL:', user.profile_picture);
        setProfilePic(user.profile_picture);
        return;
      }

      // If profile_picture is an S3 key, fetch the pre-signed URL
      console.log('Settings: Fetching pre-signed URL for S3 key:', user.profile_picture);
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/profile/picture-url`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Settings: Received profile picture URL:', data.profilePictureUrl);
          setProfilePic(data.profilePictureUrl);
        } else {
          console.error('Settings: Failed to fetch profile picture URL:', response.status);
          setProfilePic(null);
        }
      } catch (error) {
        console.error('Settings: Error fetching profile picture URL:', error);
        setProfilePic(null);
      }
    };

    fetchProfilePictureUrl();
  }, [user?.profile_picture]); // Always fetch when user.profile_picture changes

  // Password strength feedback
  useEffect(() => {
    const v = passwordForm.newPassword;
    const passed = passwordRequirements.filter(r => r.test(v)).length;
    if (!v) setPasswordStrength('');
    else if (passed <= 2) setPasswordStrength('Weak');
    else if (passed === 3 || passed === 4) setPasswordStrength('Medium');
    else setPasswordStrength('Strong');
  }, [passwordForm.newPassword]);

  const handleUsernameUpdate = async () => {
    if (!username.trim()) {
      setMessage({ type: 'error', text: 'Username cannot be empty' });
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: username.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        updateUser({ ...user, name: username.trim() });
        setMessage({ type: 'success', text: 'Username updated successfully!' });
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update username' });
      }
    } catch (error) {
      console.error('Error updating username:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordModal(false);
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    setMessage({ type: '', text: '' });
    
    const formData = new FormData();
    formData.append('profilePicture', file);
    const token = localStorage.getItem('token');
    
    try {
      // Upload the profile picture to S3
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/profile/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update local state with the temporary URL for immediate display
        setProfilePic(data.profilePictureUrl);
        // Update the global user state with the S3 key (from the returned user object)
        updateUser({ ...user, profile_picture: data.user.profile_picture });
        setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to upload profile picture.' });
      }
    } catch (err) {
      console.error('Profile picture upload error:', err);
      setMessage({ type: 'error', text: 'Error uploading profile picture. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleCapsLock = (e, field) => {
    setCapsLock(prev => ({ ...prev, [field]: e.getModifierState && e.getModifierState('CapsLock') }));
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Message Display */}
        {message.text && (
          <div className={`p-4 rounded-lg ${
            message.type === 'error' 
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' 
              : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Account Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Picture</label>
              {console.log('ProfilePic value:', profilePic)}
              {console.log('User profile_picture:', user?.profile_picture)}
              <div className="relative mb-2">
                {profilePic ? (
                  <img 
                    src={profilePic} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
                    style={{ display: 'block' }} // Ensure image is always visible
                    onError={(e) => {
                      console.error('Failed to load profile image:', profilePic);
                      console.error('Image error event:', e);
                      // Don't hide on error, let it show broken image icon
                    }}
                    onLoad={(e) => {
                      console.log('Profile image loaded successfully:', profilePic);
                      e.target.style.display = 'block'; // Ensure it stays visible
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center text-3xl text-white">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <button
                  type="button"
                  className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow"
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                  title="Change profile picture"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2a2.828 2.828 0 11-4-4 2.828 2.828 0 014 4z" />
                  </svg>
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleProfilePicChange}
                  disabled={uploading}
                />
              </div>
              {uploading && <div className="text-xs text-blue-600 mt-1">Uploading...</div>}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username"
                />
                <button
                  onClick={handleUsernameUpdate}
                  disabled={isUpdating || username === user?.name}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                    ✓ Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Button */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="inline-flex items-center px-4 py-2 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              🔒 Change password
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferences</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Additional settings and preferences will be available here in future updates.
          </p>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">Change Password</h2>
            {/* Show error/success message inside modal */}
            {message.text && (
              <div className={`mb-4 p-3 rounded text-center text-sm font-medium ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {message.text}
              </div>
            )}
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    onKeyUp={e => handleCapsLock(e, 'current')}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {capsLock.current && <div className="text-xs text-yellow-600 mt-1">Caps Lock is ON</div>}
              </div>
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    onKeyUp={e => handleCapsLock(e, 'new')}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {capsLock.new && <div className="text-xs text-yellow-600 mt-1">Caps Lock is ON</div>}
                <div className="mt-1 text-xs">
                  {passwordRequirements.map(r => (
                    <div key={r.label} className={r.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}>
                      {r.label}
                    </div>
                  ))}
                  {passwordStrength && (
                    <div className={`mt-1 font-semibold ${passwordStrength === 'Strong' ? 'text-green-600' : passwordStrength === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>Strength: {passwordStrength}</div>
                  )}
                </div>
              </div>
              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    onKeyUp={e => handleCapsLock(e, 'confirm')}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {capsLock.confirm && <div className="text-xs text-yellow-600 mt-1">Caps Lock is ON</div>}
              </div>
            </div>
            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setShowPasswords({ current: false, new: false, confirm: false });
                  setCapsLock({ current: false, new: false, confirm: false });
                }}
                className="px-4 py-2 text-blue-600 border border-blue-600 bg-white hover:bg-blue-50 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {isUpdating ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

