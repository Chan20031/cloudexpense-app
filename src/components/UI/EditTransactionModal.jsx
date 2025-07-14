import React, { useState, useEffect } from 'react';

export default function EditTransactionModal({ transaction, onClose, onSave, onDelete, title = "Edit Transaction" }) {
  const [item, setItem] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (transaction) {
      setItem(transaction.item || '');
      setCategory(transaction.category || '');
      setAmount(transaction.amount || '');
    }
  }, [transaction]);

  const handleSave = () => {
    onSave({ ...transaction, item, category, amount: parseFloat(amount) });
    onClose();
  };

  const confirmDelete = () => setShowConfirm(true);
  const cancelDelete = () => setShowConfirm(false);

  const handleDeleteConfirmed = () => {
    onDelete(transaction.id);
    setShowConfirm(false);
    onClose();
  };

  const expenseCategories = [
    'Food', 'Transport', 'Shopping', 'Bills', 'Education', 'Health', 'Others'
  ];
  const incomeCategories = [
    'Salary', 'Allowance', 'Others'
  ];
  const isIncome = transaction && (transaction.type === 'income' || transaction.category === 'Salary' || transaction.category === 'Allowance');

  if (!transaction) return null;

  return (
    <>
      {/* Main Edit Modal */}
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-40">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>

          <input
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="Item"
            className="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:text-white"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:text-white"
          >
            {(isIncome ? incomeCategories : expenseCategories).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
          />

          <div className="flex justify-between items-center gap-2">
            <button
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg w-full"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold px-4 py-2 rounded-lg w-full"
            >
              Delete
            </button>
            <button
              onClick={handleSave}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg w-full"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Deletion Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 w-full max-w-sm text-center border dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Are you sure?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={cancelDelete}
                className="px-5 py-2 border text-gray-800 dark:text-white dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
