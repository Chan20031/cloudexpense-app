import React, { useContext, useState, useEffect } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { ExpenseContext } from '../context/ExpenseContext';
import { BudgetContext } from '../context/BudgetContext';
import { IncomeContext } from '../context/IncomeContext';
import useSettings from '../hooks/useSettings';
import EditTransactionModal from '../components/UI/EditTransactionModal';
import AddTransactionModal from '../components/UI/AddTransactionModal';

export default function DashboardPage() {
  const { expenses, deleteExpense, updateExpense, refreshTransactions } = useContext(ExpenseContext);
  const { budget, refreshBudget } = useContext(BudgetContext);
  const { incomeEntries, refreshIncomeEntries, deleteIncomeEntry, updateIncomeEntry } = useContext(IncomeContext);
  const { settings } = useSettings();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add state for selected month/year
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Update the current date every minute to ensure real-time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 30000); // Update every 30 seconds for better real-time experience
    
    return () => clearInterval(timer);
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const handleTransactionAdded = () => {
      // Refresh all data
      if (refreshTransactions) {
        refreshTransactions();
      }
      if (refreshBudget) {
        refreshBudget();
      }
      if (refreshIncomeEntries) {
        refreshIncomeEntries();
      }
    };

    window.addEventListener('transactionAdded', handleTransactionAdded);
    return () => window.removeEventListener('transactionAdded', handleTransactionAdded);
  }, [refreshTransactions, refreshBudget, refreshIncomeEntries]);

  // Format the current month and year
  const formattedMonth = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const [selectedTx, setSelectedTx] = useState(null);

  // Pagination handlers
  const handlePrevMonth = () => {
    setSelectedDate(prev => {
      const prevMonth = new Date(prev);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      return prevMonth;
    });
  };
  const handleNextMonth = () => {
    setSelectedDate(prev => {
      const nextMonth = new Date(prev);
      // Prevent going beyond current month
      const now = new Date();
      if (
        nextMonth.getFullYear() > now.getFullYear() ||
        (nextMonth.getFullYear() === now.getFullYear() && nextMonth.getMonth() > now.getMonth())
      ) {
        return prev;
      }
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    });
  };

  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  // Filter transactions for selected month/year
  const filteredExpenses = expenses.filter(e => {
    const date = new Date(e.created_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const filteredIncome = incomeEntries.filter(e => {
    const date = new Date(e.created_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const allTransactions = [
    ...filteredExpenses.map(e => ({ ...e, type: 'expense' })),
    ...filteredIncome.map(e => ({ ...e, type: 'income' })),
  ];

  // Sort transactions by created_at (latest first)
  const sortedTransactions = allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Filter transactions based on search query
  const filteredTransactions = sortedTransactions.filter(tx => {
    if (!searchQuery.trim()) return true;
    const searchTerm = searchQuery.toLowerCase();
    const itemName = (tx.item || tx.category || '').toLowerCase();
    const category = (tx.category || '').toLowerCase();
    return itemName.includes(searchTerm) || category.includes(searchTerm);
  });

  const grouped = filteredTransactions.reduce((acc, tx) => {
    // Use browser's local timezone for date grouping
    const date = new Date(tx.created_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {});

  // Helper for month/year label
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthLabel = `${monthNames[currentMonth]} ${currentYear}`;

  // Calculate financial data for selected month
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalIncome = filteredIncome.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const remaining = totalIncome - totalExpenses;
  const totalBudget = Number(budget) || 0;

  const getCategoryIcon = (category, type) => {
    if (type === 'income') return '💵';
    switch (category) {
      case 'Food': return '🍔';
      case 'Transport': return '🚗';
      case 'Shopping': return '🛍️';
      case 'Bills': return '💡';
      case 'Education': return '🎓';
      case 'Health': return '🏥';
      case 'Others': return '❓';
      case 'Salary': return '💰';
      case 'Allowance': return '🪙';
      default: return '💸';
    }
  };

  const updateIncome = (updated) => {
    const updatedList = incomeEntries.map(tx =>
      tx.id === updated.id ? updated : tx
    );
    localStorage.setItem('incomeEntries', JSON.stringify(updatedList));
    setIncomeEntries(updatedList);
    setSelectedTx(null);
  };

  const deleteIncome = (id) => {
    const updatedList = incomeEntries.filter(tx => tx.id !== id);
    localStorage.setItem('incomeEntries', JSON.stringify(updatedList));
    setIncomeEntries(updatedList);
    setSelectedTx(null);
  };

  const handleUpdate = async (tx) => {
    if (tx.type === 'income') {
      await updateIncomeEntry(tx);
      if (refreshIncomeEntries) refreshIncomeEntries();
    } else {
      const result = await updateExpense(tx);
      if (result.success && refreshBudget) {
        setTimeout(() => refreshBudget(), 100);
      }
    }
  };

  const handleDelete = async (id, type) => {
    if (type === 'income') {
      await deleteIncomeEntry(id);
      if (refreshIncomeEntries) refreshIncomeEntries();
    } else {
      const result = await deleteExpense(id);
      if (result.success && refreshBudget) {
        setTimeout(() => refreshBudget(), 100);
      }
    }
    setSelectedTx(null);
  };

  const handleAddModalClose = () => {
    setShowAddModal(false);
    // Refresh data after adding
    refreshTransactions();
    setIncomeEntries(JSON.parse(localStorage.getItem('incomeEntries') || '[]'));
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery(''); // Clear search when closing
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="p-4 space-y-6 bg-white dark:bg-gray-900 min-h-screen">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{formattedMonth}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">Financial Summary</p>
      </div>

      {/* Updated Budget Overview with stable calculations */}
      <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg shadow-sm border border-green-200 dark:border-green-800 max-w-xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 text-center">Budget Overview</h3>
        <div className="space-y-2 text-base font-medium">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Total Income:</span>
            <span className="text-blue-600 dark:text-blue-400">
              MYR {totalIncome.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Total Expenses:</span>
            <span className="text-red-500 dark:text-red-400">
              MYR {totalExpenses.toFixed(2)}
            </span>
          </div>
          <div className="border-t border-green-300 dark:border-green-700 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-800 dark:text-white font-semibold">Remaining:</span>
              <span className={`font-bold ${remaining < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                MYR {remaining.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Progress bar based on budget usage */}
        {totalBudget > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Budget Usage</span>
              <span>{((totalExpenses / totalBudget) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  totalExpenses > totalBudget ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min((totalExpenses / totalBudget) * 100, 100)}%` 
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Budget: MYR {totalBudget.toFixed(2)}
            </div>
          </div>
        )}

        {/* Budget Overview Note */}
        <div className="mt-2 mb-6 text-xs text-blue-700 dark:text-blue-300 text-center">
          <strong>Note:</strong> Budget and category budgets must be updated manually for each month. If you do not update them, the same values will be used for every month after the first time you set them.
        </div>
      </div>

      {/* Daily Transactions with ADD and SEARCH buttons */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Daily Transactions</h3>
          <div className="flex items-center gap-2">
            {/* Search Toggle Button */}
            <button
              onClick={toggleSearch}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors shadow-sm ${
                showSearch 
                  ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
              title="Search transactions"
            >
              <Search className="w-4 h-4" />
              <span className="font-medium">Search</span>
            </button>
            
            {/* Add Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm"
              title="Add new transaction"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add</span>
            </button>
          </div>
        </div>

        {/* Month Navigation - improved UI */}
        <div className="flex items-center justify-center mb-8 gap-4">
          <button
            onClick={handlePrevMonth}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous Month"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span className="text-lg font-semibold text-gray-800 dark:text-white px-4 py-2 bg-white dark:bg-gray-800 rounded shadow border border-gray-200 dark:border-gray-700">
            {monthLabel}
          </span>
          <button
            onClick={handleNextMonth}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next Month"
            disabled={(() => {
              const now = new Date();
              return currentYear === now.getFullYear() && currentMonth === now.getMonth();
            })()}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>

        {/* Search Input */}
        {showSearch && (
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions by name or category..."
                className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {filteredTransactions.length} transaction(s) found for "{searchQuery}"
              </p>
            )}
          </div>
        )}

        {Object.entries(grouped).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              {searchQuery ? (
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              ) : (
                <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery ? `No transactions found for "${searchQuery}"` : 'No transactions yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Add Your First Transaction
              </button>
            )}
          </div>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([date, records]) => {
              const incomeSum = records.filter(r => r.type === 'income').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
              const expenseSum = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

              return (
                <div key={date} className="mb-6">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-md font-semibold text-blue-600 dark:text-blue-400">{date}</h4>
                    <div className="text-sm space-x-4">
                      {incomeSum > 0 && (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          Income: MYR {incomeSum.toFixed(2)}
                        </span>
                      )}
                      {expenseSum > 0 && (
                        <span className="text-red-500 dark:text-red-400 font-medium">
                          Expenses: MYR {expenseSum.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-sm text-gray-600 dark:text-gray-300 border-b">
                        <th className="py-1">Time</th>
                        <th className="py-1">Item</th>
                        <th className="py-1">Category</th>
                        <th className="py-1 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Latest transactions on top
                        .map((tx, idx) => (
                          <tr
                            key={idx}
                            onClick={() => setSelectedTx(tx)}
                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-sm border-b dark:border-gray-700"
                          >
                            <td className="py-1">
                              {new Date(tx.created_at).toLocaleTimeString(undefined, {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </td>
                            <td className="py-1 flex items-center gap-2">
                              <span className="text-lg">{getCategoryIcon(tx.category, tx.type)}</span>
                              {tx.item || tx.category}
                            </td>
                            <td className="py-1">{tx.category}</td>
                            <td className={`py-1 text-right ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                              MYR {(Number(tx.amount) || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              );
            })
        )}
      </div>

      {/* Modals */}
      {selectedTx && (
        <EditTransactionModal
          transaction={selectedTx}
          title="Edit Transaction"
          onClose={() => setSelectedTx(null)}
          onSave={handleUpdate}
          onDelete={(id) => handleDelete(id, selectedTx.type)}
        />
      )}

      <AddTransactionModal
        isOpen={showAddModal}
        onClose={handleAddModalClose}
      />
    </div>
  );
}

