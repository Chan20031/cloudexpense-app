import React, { useState, useContext, useEffect } from 'react';
import { X, Plus, Upload, Calculator, Utensils, Car, ShoppingBag, Receipt, GraduationCap, Heart, MoreHorizontal, DollarSign, Gift, Briefcase, TrendingUp, PiggyBank } from 'lucide-react';
import { ExpenseContext } from '../../context/ExpenseContext';
import { IncomeContext } from '../../context/IncomeContext';
import { AuthContext } from '../../context/AuthContext';
import CalculatorComponent from './CalculatorComponent';

export default function AddTransactionModal({ isOpen, onClose }) {
  const { addExpense } = useContext(ExpenseContext);
  const { addIncomeEntry } = useContext(IncomeContext);
  const { user } = useContext(AuthContext);
  const [transactionType, setTransactionType] = useState('expense');
  const [form, setForm] = useState({
    item: '',
    category: transactionType === 'expense' ? 'Food' : 'Salary',
    amount: '',
    receipt: null,
    created_at: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) // default to local time
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [receiptError, setReceiptError] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);

  const expenseCategories = [
    { name: 'Food', icon: Utensils },
    { name: 'Transport', icon: Car },
    { name: 'Shopping', icon: ShoppingBag },
    { name: 'Bills', icon: Receipt },
    { name: 'Education', icon: GraduationCap },
    { name: 'Health', icon: Heart },
    { name: 'Others', icon: MoreHorizontal }
  ];
  
  const incomeCategories = [
    { name: 'Salary', icon: DollarSign },
    { name: 'Allowance', icon: PiggyBank },
    { name: 'Others', icon: MoreHorizontal }
  ];

  const handleTypeChange = (type) => {
    setTransactionType(type);
    setForm(prev => ({
      ...prev,
      category: type === 'expense' ? 'Food' : 'Salary',
      created_at: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.item.trim() || !form.amount || parseFloat(form.amount) <= 0) {
      setMessage({ type: 'error', text: 'Please fill in all required fields with valid values.' });
      return;
    }
    
    try {
      setIsSubmitting(true);
      setMessage({ type: '', text: '' });
      
      // Convert datetime-local (YYYY-MM-DDTHH:mm) to 'YYYY-MM-DD HH:mm:ss' for backend/DB
      let createdAt = form.created_at;
      if (createdAt && createdAt.length === 16) {
        createdAt = createdAt.replace('T', ' ') + ':00';
      }
      const data = {
        item: form.item.trim(),
        category: form.category,
        amount: parseFloat(form.amount),
        created_at: createdAt
      };
      
      let result;
      if (transactionType === 'expense') {
        result = await addExpense(data);
      } else {
        result = await addIncomeEntry(data);
      }
      
      if (result.success) {
        // Dispatch event for real-time updates
        window.dispatchEvent(new Event('transactionAdded'));
        setMessage({ type: 'success', text: `${transactionType === 'expense' ? 'Expense' : 'Income'} added successfully!` });
        resetForm();
        setTimeout(() => onClose(), 1500);
      } else {
        throw new Error(result.message || 'Failed to add transaction');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'An error occurred while adding the transaction.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      item: '',
      category: transactionType === 'expense' ? 'Food' : 'Salary',
      amount: '',
      receipt: null,
      created_at: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    });
    setMessage({ type: '', text: '' });
  };

  const handleCalculatorResult = (result) => {
    setForm(prev => ({ ...prev, amount: result.toString() }));
    setShowCalculator(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setReceiptError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add New Transaction
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Transaction Type Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
            <button
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                transactionType === 'expense'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Expense
            </button>
            <button
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                transactionType === 'income'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Income
            </button>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`p-3 rounded-lg mb-4 ${
              message.type === 'error' 
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' 
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Processing Receipt Message */}
          {isProcessingReceipt && (
            <div className="p-3 rounded-lg mb-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              Processing receipt, please wait...
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {transactionType === 'expense' ? 'Expense' : 'Income'} Description
              </label>
              <input
                type="text"
                value={form.item}
                onChange={(e) => setForm(prev => ({ ...prev, item: e.target.value }))}
                placeholder={`Enter ${transactionType} description`}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Date/Time Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={form.created_at}
                onChange={e => setForm(prev => ({ ...prev, created_at: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
                max={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {(transactionType === 'expense' ? expenseCategories : incomeCategories).map(cat => {
                  const IconComponent = cat.icon;
                  return (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  );
                })}
              </select>
              
              {/* Category Preview with Icon */}
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                {(() => {
                  const currentCategories = transactionType === 'expense' ? expenseCategories : incomeCategories;
                  const selectedCategory = currentCategories.find(cat => cat.name === form.category);
                  if (selectedCategory) {
                    const IconComponent = selectedCategory.icon;
                    return (
                      <>
                        <IconComponent className="w-4 h-4" />
                        <span>Selected: {selectedCategory.name}</span>
                      </>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (MYR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCalculator(true)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Open calculator"
                >
                  <Calculator className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Receipt Upload (for expenses only) */}
            {transactionType === 'expense' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Receipt (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    id="receipt-upload"
                    onChange={async (e) => {
                      setReceiptError('');
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.size > 1 * 1024 * 1024) {
                        setReceiptError('File size exceeds 1MB. Please select a smaller file.');
                        e.target.value = '';
                        setForm(prev => ({ ...prev, receipt: null }));
                        return;
                      }
                      setIsProcessingReceipt(true);
                      // Upload to backend immediately
                      const formData = new FormData();
                      formData.append('receipt', file);
                      try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/upload`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                          },
                          body: formData,
                        });
                        const result = await response.json();
                        if (!response.ok) {
                          setReceiptError(result.message || 'Upload failed');
                          setForm(prev => ({ ...prev, receipt: null }));
                          return;
                        }
                        setForm(prev => ({
                          ...prev,
                          amount: result.amount || '',
                          item: result.item || '',
                          category: result.category || prev.category,
                          receipt: file,
                        }));
                        setMessage({ type: 'success', text: result.message || 'Receipt processed.' });
                      } catch (err) {
                        setReceiptError('Upload failed');
                        setForm(prev => ({ ...prev, receipt: null }));
                      } finally {
                        setIsProcessingReceipt(false);
                      }
                    }}
                  />
                  <label htmlFor="receipt-upload">
                    <span
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Receipt
                    </span>
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {form.receipt ? 'File selected' : 'No file selected'}
                  </span>
                </div>
                {receiptError && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {receiptError}
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                transactionType === 'expense'
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Adding...' : `Add ${transactionType === 'expense' ? 'Expense' : 'Income'}`}
            </button>
          </form>
        </div>
      </div>

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Calculator</h3>
              <button
                onClick={() => setShowCalculator(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <CalculatorComponent onResult={handleCalculatorResult} />
          </div>
        </div>
      )}
    </div>
  );
}

