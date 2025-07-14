import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function ThemeToggle() {
  const { user, settings, setSettings } = useContext(AuthContext);

  if (!user) return null; // 🚫 Don't show on non-auth pages

  const dark = settings?.theme === 'dark';

  const toggleTheme = () => {
    const newTheme = dark ? 'light' : 'dark';
    setSettings(prev => ({ ...prev, theme: newTheme }));
  };

  return (
    <button
      onClick={toggleTheme}
      className="px-3 py-1 text-sm font-medium rounded border border-gray-300 bg-white dark:bg-gray-800 text-gray-700 dark:text-white"
    >
      {dark ? '☀️ Light Mode' : '🌙 Dark Mode'}
    </button>
  );
}
