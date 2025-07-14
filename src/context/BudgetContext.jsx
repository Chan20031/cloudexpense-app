import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';

export const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
  const [budget, setBudget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  // Fetch user's budget when authenticated
  useEffect(() => {
    if (user) {
      fetchBudget();
    } else {
      setBudget(0);
      setLoading(false);
    }
  }, [user]);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/budget`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch budget');
      
      const data = await response.json();
      setBudget(data.amount || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching budget:', err);
      // If API fails, try to get from localStorage as fallback
      const stored = JSON.parse(localStorage.getItem('budget') || '0');
      setBudget(stored);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBudget = async (amount) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/budget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });
      
      if (!response.ok) throw new Error('Failed to update budget');
      
      const data = await response.json();
      setBudget(data.amount);
      setError(null);
      
      // Also update localStorage as backup
      localStorage.setItem('budget', JSON.stringify(amount));
      
      return { success: true };
    } catch (err) {
      console.error('Error updating budget:', err);
      setError(err.message);
      
      // Still update localStorage even if API fails
      localStorage.setItem('budget', JSON.stringify(amount));
      setBudget(amount);
      
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <BudgetContext.Provider value={{ 
      budget, 
      updateBudget, 
      loading,
      error,
      refreshBudget: fetchBudget
    }}>
      {children}
    </BudgetContext.Provider>
  );
};
