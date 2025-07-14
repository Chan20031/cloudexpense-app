import React, { useContext, useState, useEffect } from 'react';
import { BudgetContext } from '../context/BudgetContext';
import { CategoryBudgetContext } from '../context/CategoryBudgetContext';
import { ExpenseContext } from '../context/ExpenseContext';
import { AuthContext } from '../context/AuthContext';

export default function BudgetPage() {
  const { budget, updateBudget, refreshBudget } = useContext(BudgetContext);
  const { categoryBudgets, setCategoryBudgets, refreshCategoryBudgets } = useContext(CategoryBudgetContext);
  const { expenses } = useContext(ExpenseContext);
  const { user } = useContext(AuthContext);
  
  const [localBudget, setLocalBudget] = useState(budget || '');
  const [localCategoryBudgets, setLocalCategoryBudgets] = useState(categoryBudgets || {});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const categories = ['Food', 'Bills', 'Health', 'Others', 'Shopping', 'Education', 'Transport'];

  useEffect(() => {
    setLocalBudget(budget || '');
    setLocalCategoryBudgets(categoryBudgets || {});
    // eslint-disable-next-line
  }, [user]); // Only run on mount or user change

  const handleBudgetSave = async () => {
    try {
      const budgetValue = parseFloat(localBudget) || 0;
      await updateBudget(budgetValue);
      setLastUpdated(new Date());
      setMessage({ type: 'success', text: 'Budget updated successfully!' });
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update budget. Please try again.' });
    }
  };

  const handleCategoryBudgetChange = (category, value) => {
    setLocalCategoryBudgets(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleCategoryBudgetSave = async () => {
    try {
      const cleanedBudgets = {};
      Object.entries(localCategoryBudgets).forEach(([category, value]) => {
        const numValue = parseFloat(value) || 0;
        if (numValue > 0) {
          cleanedBudgets[category] = numValue;
        }
      });
      
      await setCategoryBudgets(cleanedBudgets);
      setLastUpdated(new Date());
      setMessage({ type: 'success', text: 'Category budgets updated successfully!' });
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update category budgets. Please try again.' });
    }
  };

  // Remove selectedDate and pagination logic, revert to current month only
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter expenses for current month and year
  const monthlyExpenses = expenses.filter(expense => {
    const date = new Date(expense.created_at || expense.id);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  // Calculate spending by category for current month
  const categorySpending = categories.reduce((acc, category) => {
    const spent = monthlyExpenses
      .filter(expense => expense.category === category)
      .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    acc[category] = spent;
    return acc;
  }, {});

  const totalCategoryBudgets = Object.values(localCategoryBudgets).reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
  const totalSpent = Object.values(categorySpending).reduce((sum, value) => sum + value, 0);

  // Helper for month/year label
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthLabel = `${monthNames[currentMonth]} ${currentYear}`;

  return (
    <div className="p-6 space-y-6 bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Budget Management</h1>

        {/* Message */}
        {message.text && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'error' 
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' 
              : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Overall Budget Setting */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Monthly Budget</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Monthly Budget (MYR)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={localBudget}
                onChange={(e) => setLocalBudget(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="Enter your monthly budget"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={handleBudgetSave}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
            >
              Save Budget
            </button>
          </div>
          
          {budget > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-300">Current Budget:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">MYR {(Number(budget) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-300">Total Spent:</span>
                <span className="font-semibold text-red-500 dark:text-red-400">MYR {(Number(totalSpent) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-300">Remaining:</span>
                <span className={`font-semibold ${(Number(budget) || 0) - (Number(totalSpent) || 0) < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  MYR {((Number(budget) || 0) - (Number(totalSpent) || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>

        {/* Category Budgets */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Category Budgets</h2>
            <button
              onClick={handleCategoryBudgetSave}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
            >
              Save All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(category => {
              const budgetAmount = parseFloat(localCategoryBudgets[category]) || 0;
              const spentAmount = categorySpending[category] || 0;
              const remaining = budgetAmount - spentAmount;
              const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

              return (
                <div key={category} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-800 dark:text-white">{category}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {percentage.toFixed(1)}% used
                    </span>
                  </div>
                  
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={localCategoryBudgets[category] || ''}
                    onChange={(e) => handleCategoryBudgetChange(category, e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="Set budget"
                    className="w-full p-2 mb-3 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  />

                  {budgetAmount > 0 && (
                    <>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>Spent: MYR {spentAmount.toFixed(2)}</span>
                        <span className={remaining < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                          Remaining: MYR {remaining.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {totalCategoryBudgets > 0 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white mb-2">Category Budget Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total Category Budgets:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">MYR {totalCategoryBudgets.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total Category Spending:</span>
                  <span className="font-semibold text-red-500 dark:text-red-400">MYR {totalSpent.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Budget Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mt-8">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">💡 Budget Tips</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 mb-2">
            <li>• Set realistic budgets based on your income and expenses</li>
            <li>• Review and adjust your budgets monthly</li>
            <li>• Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings</li>
            <li>• Track your spending regularly to stay on budget</li>
            <li>• Add transactions using the ADD button on the Dashboard</li>
          </ul>
          <div className="text-xs text-blue-700 dark:text-blue-400 mt-2">
            <strong>Note:</strong> Budget and category budgets must be updated manually for each month. If you do not update them, the same values will be used for every month after the first time you set them.
          </div>
        </div>
      </div>
    </div>
  );
}

