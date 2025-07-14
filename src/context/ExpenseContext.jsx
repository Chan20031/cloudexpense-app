import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';

export const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's transactions when authenticated
  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setExpenses([]);
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

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }
      
      const data = await response.json();
      setExpenses(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching transactions:', err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch transactions when user changes
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addExpense = async (expense) => {
    if (isSubmitting) return { success: false, message: 'A request is already in progress' };
    
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(expense)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add transaction');
      }
      
      const newTransaction = await response.json();
      setExpenses(prev => [newTransaction, ...prev]);
      setError(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error adding transaction:', err);
      return { success: false, message: err.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateExpense = async (updatedExpense) => {
    if (isSubmitting) return { success: false, message: 'A request is already in progress' };
    
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/transactions/${updatedExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedExpense)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update transaction');
      }
      
      const updated = await response.json();
      setExpenses(prev => prev.map(exp => exp.id === updated.id ? updated : exp));
      setError(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error updating transaction:', err);
      return { success: false, message: err.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteExpense = async (id) => {
    if (isSubmitting) return { success: false, message: 'A request is already in progress' };
    
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete transaction');
      }
      
      setExpenses(prev => prev.filter(exp => exp.id !== id));
      setError(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error deleting transaction:', err);
      return { success: false, message: err.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to migrate localStorage data to the server
  const migrateLocalData = async () => {
    try {
      const localData = JSON.parse(localStorage.getItem('expenses') || '[]');
      if (localData.length === 0) return { success: true, count: 0 };
      
      setLoading(true);
      let migratedCount = 0;
      
      for (const expense of localData) {
        const result = await addExpense({
          item: expense.item,
          category: expense.category,
          amount: expense.amount,
          receipt_image: expense.receipt || null
        });
        
        if (result.success) migratedCount++;
      }
      
      // Clear localStorage after migration
      localStorage.removeItem('expenses');
      
      return { success: true, count: migratedCount };
    } catch (err) {
      console.error('Error migrating local data:', err);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExpenseContext.Provider value={{ 
      expenses, 
      addExpense, 
      deleteExpense, 
      updateExpense,
      loading,
      error,
      refreshTransactions: fetchTransactions,
      migrateLocalData,
      isSubmitting
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

