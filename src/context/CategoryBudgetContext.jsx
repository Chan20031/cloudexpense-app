import { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';

export const CategoryBudgetContext = createContext();

export const CategoryBudgetProvider = ({ children }) => {
  const defaultBudgets = {
    Food: 0,
    Transport: 0,
    Shopping: 0,
    Bills: 0,
    Education: 0,
    Health: 0,
    Others: 0
  };

  const [categoryBudgets, setCategoryBudgets] = useState(defaultBudgets);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  // Fetch user's category budgets when authenticated
  useEffect(() => {
    if (user) {
      fetchCategoryBudgets();
    } else {
      setCategoryBudgets(defaultBudgets);
      setLoading(false);
    }
  }, [user]);

  const fetchCategoryBudgets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/category-budgets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch category budgets');
      
      const data = await response.json();
      setCategoryBudgets(data || defaultBudgets);
      setError(null);
    } catch (err) {
      console.error('Error fetching category budgets:', err);
      // If API fails, try to get from localStorage as fallback
      const saved = localStorage.getItem('categoryBudgets');
      setCategoryBudgets(saved ? JSON.parse(saved) : defaultBudgets);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCategoryBudgets = async (newBudgets) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/category-budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBudgets)
      });
      
      if (!response.ok) throw new Error('Failed to update category budgets');
      
      const data = await response.json();
      setCategoryBudgets(data);
      setError(null);
      
      // Also update localStorage as backup
      localStorage.setItem('categoryBudgets', JSON.stringify(newBudgets));
      
      return { success: true };
    } catch (err) {
      console.error('Error updating category budgets:', err);
      setError(err.message);
      
      // Still update localStorage and state even if API fails
      localStorage.setItem('categoryBudgets', JSON.stringify(newBudgets));
      setCategoryBudgets(newBudgets);
      
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <CategoryBudgetContext.Provider value={{ 
      categoryBudgets, 
      setCategoryBudgets: updateCategoryBudgets, 
      loading,
      error,
      refreshCategoryBudgets: fetchCategoryBudgets
    }}>
      {children}
    </CategoryBudgetContext.Provider>
  );
};

export const useCategoryBudgets = () => useContext(CategoryBudgetContext);
