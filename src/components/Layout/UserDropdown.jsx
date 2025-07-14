import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Moon, Sun, User, LogOut } from 'lucide-react';
import useSettings from '../../hooks/useSettings';

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const [localTheme, setLocalTheme] = useState(settings.theme);

  // Sync localTheme with context
  useEffect(() => {
    setLocalTheme(settings.theme);
  }, [settings.theme]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle light/dark theme
  const toggleTheme = () => {
    const newTheme = localTheme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    setLocalTheme(newTheme);
  };

  // Logout and redirect to homepage
  const [profilePicUrl, setProfilePicUrl] = useState(null);

  // Fetch profile picture URL for S3 keys
  useEffect(() => {
    const fetchProfilePictureUrl = async () => {
      if (!user?.profile_picture) {
        setProfilePicUrl(null);
        return;
      }

      // If it's already a URL, use it directly
      if (user.profile_picture.startsWith('http')) {
        setProfilePicUrl(user.profile_picture);
        return;
      }

      // If profile_picture is an S3 key, fetch the pre-signed URL
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/profile/picture-url`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfilePicUrl(data.profilePictureUrl);
        } else {
          setProfilePicUrl(null);
        }
      } catch (error) {
        console.error('Error fetching profile picture URL:', error);
        setProfilePicUrl(null);
      }
    };

    fetchProfilePictureUrl();
  }, [user?.profile_picture]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const navigateToSettings = () => {
    setIsOpen(false);
    navigate('/settings');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full p-3 text-left bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-all"
      >
        {profilePicUrl ? (
          <img
            src={profilePicUrl}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover border-2 border-green-500"
          />
        ) : (
          <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <div className="text-sm font-medium truncate">{user.name || 'User'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
        </div>
        <div className="text-gray-400 dark:text-gray-500 ml-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v.01M12 12v.01M12 18v.01" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {profilePicUrl ? (
                <img
                  src={profilePicUrl}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-green-500"
                />
              ) : (
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.name || 'User'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
              </div>
            </div>
          </div>

          {/* Menu Options */}
          <div className="py-1 text-sm">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center w-full gap-3 px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all"
            >
              {localTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {localTheme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>

            {/* Settings Page */}
            <button
              onClick={navigateToSettings}
              className="flex items-center w-full gap-3 px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all"
            >
              <User className="w-4 h-4" />
              Settings
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center w-full gap-3 px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="hover:underline cursor-pointer">Terms of services</div>
            <div className="hover:underline cursor-pointer">Privacy policy</div>
          </div>
        </div>
      )}
    </div>
  );
}
