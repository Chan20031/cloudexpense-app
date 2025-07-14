import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';

export const IncomeContext = createContext();

export const IncomeProvider = ({ children }) => {
  const [incomeEntries, setIncomeEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's income entries when authenticated
  const fetchIncomeEntries = useCallback(async () => {
    if (!user) {
      setIncomeEntries([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/income`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`Failed to fetch income entries: ${response.status}`);
      }
      
      const data = await response.json();
      setIncomeEntries(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching income entries:', err);
      setIncomeEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch income entries when user changes
  useEffect(() => {
    fetchIncomeEntries();
  }, [fetchIncomeEntries]);

  const addIncomeEntry = async (income) => {
    if (isSubmitting) return { success: false, message: 'A request is already in progress' };
    
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/income`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(income)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add income entry');
      }
      
      const newIncome = await response.json();
      setIncomeEntries(prev => [newIncome, ...prev]);
      setError(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error adding income entry:', err);
      return { success: false, message: err.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateIncomeEntry = async (updatedIncome) => {
    if (isSubmitting) return { success: false, message: 'A request is already in progress' };
    
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/income/${updatedIncome.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedIncome)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update income entry');
      }
      
      const updated = await response.json();
      setIncomeEntries(prev => prev.map(income => income.id === updated.id ? updated : income));
      setError(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error updating income entry:', err);
      return { success: false, message: err.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteIncomeEntry = async (id) => {
    if (isSubmitting) return { success: false, message: 'A request is already in progress' };
    
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/income/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete income entry');
      }
      
      setIncomeEntries(prev => prev.filter(income => income.id !== id));
      setError(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error deleting income entry:', err);
      return { success: false, message: err.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to migrate localStorage data to the server
  const migrateLocalIncomeData = async () => {
    try {
      const localData = JSON.parse(localStorage.getItem('incomeEntries') || '[]');
      if (localData.length === 0) return { success: true, count: 0 };
      
      setLoading(true);
      let migratedCount = 0;
      
      for (const income of localData) {
        const result = await addIncomeEntry({
          item: income.item,
          category: income.category,
          amount: income.amount
        });
        
        if (result.success) migratedCount++;
      }
      
      // Clear localStorage after migration
      localStorage.removeItem('incomeEntries');
      
      return { success: true, count: migratedCount };
    } catch (err) {
      console.error('Error migrating local income data:', err);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <IncomeContext.Provider value={{ 
      incomeEntries, 
      addIncomeEntry, 
      deleteIncomeEntry: deleteIncomeEntry, 
      updateIncomeEntry,
      loading,
      error,
      refreshIncomeEntries: fetchIncomeEntries,
      migrateLocalIncomeData,
      isSubmitting
    }}>
      {children}
    </IncomeContext.Provider>
  );
};

