import { useContext, createContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({ currency: 'MYR' });
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  // Fetch user settings when authenticated
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user) {
        setSettings({ currency: 'MYR' });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user.settings && data.user.settings.currency) {
            setSettings({ currency: data.user.settings.currency });
          }
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSettings();
  }, [user]);

  const updateSettings = async (newSettings) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...newSettings }));
        return { success: true };
      } else {
        return { success: false, message: 'Failed to update settings' };
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings,
      loading
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export default function useSettings() {
  return useContext(SettingsContext);
}
