import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Initial auth check: User data fetched:', data.user);
            console.log('Initial auth check: User profile_picture:', data.user?.profile_picture);
            setUser(data.user);
          } else {
            // Token invalid or expired
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        // Fetch full user profile to get profile_picture and other fields
        const profileRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          console.log('Login: Full user profile fetched:', profileData.user);
          console.log('Login: User profile_picture:', profileData.user?.profile_picture);
          setUser(profileData.user);
        } else {
          console.log('Login: Profile fetch failed, using fallback user data:', data.user);
          setUser(data.user); // fallback
        }
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login. Please try again.' };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'An error occurred during signup. Please try again.' };
    }
  };

  const googleLogin = async (googleData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: googleData.name,
          email: googleData.email,
          googleId: googleData.googleId,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        // Fetch full user profile to get profile_picture and other fields
        const profileRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUser(profileData.user);
        } else {
          setUser(data.user); // fallback
        }
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, message: 'An error occurred during Google login. Please try again.' };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      return { success: response.ok, message: data.message };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, message: 'An error occurred. Please try again later.' };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, message: 'An error occurred. Please try again later.' };
    }
  };

  const deleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        logout();
        return { success: true, message: 'Account deleted successfully' };
      } else {
        const data = await response.json();
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      return { success: false, message: 'An error occurred. Please try again later.' };
    }
  };

  const updateUser = useCallback((updatedUserData) => {
    setUser(prevUser => ({ ...prevUser, ...updatedUserData }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated: !!user, // Add this computed property
      login, 
      signup, 
      logout, 
      googleLogin, 
      forgotPassword,
      updateProfile,
      deleteAccount,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
