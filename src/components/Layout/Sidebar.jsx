import { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PiggyBank,
  BarChart3,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import UserDropdown from './UserDropdown';
import Logo from '../../assets/images/Logo.png';

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: PiggyBank, label: 'Budget', path: '/budget' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: CreditCard, label: 'Accounts', path: '/accounts' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

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

  const isActive = (path) => location.pathname === path;

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header with logo and toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <motion.div
          className="flex items-center gap-3 cursor-pointer"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          onClick={() => navigate('/dashboard')}
        >
          <img
            src={Logo}
            alt="CloudExpense"
            className={`rounded-md shadow ${
              collapsed ? 'h-8 w-8' : 'h-10 w-10'
            }`}
          />
          {!collapsed && (
            <span className="text-lg font-semibold text-gray-900 dark:text-white tracking-wide">
              CloudExpense
            </span>
          )}
        </motion.div>

        {/* Toggle Button */}
        <motion.button
          onClick={() => onToggle(!collapsed)}
          whileHover={{ rotate: 180, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="ml-auto bg-white dark:bg-gray-800 p-2 rounded-full shadow hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          )}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-300 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
        {collapsed ? (
          <div className="flex justify-center">
            {profilePicUrl ? (
              <img
                src={profilePicUrl}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-green-500"
              />
            ) : (
              <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
        ) : (
          <UserDropdown />
        )}
      </div>
    </div>
  );
}
