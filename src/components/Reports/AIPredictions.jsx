import React, { useState, useEffect } from 'react';

export default function AIPredictions() {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataPoints, setDataPoints] = useState(0);

  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token found:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'null');
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/predict`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        setPredictions(data.predictions);
        setDataPoints(data.data_points_used);
      } else {
        setError(data.message || `Failed to get predictions (${response.status})`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on component mount
  useEffect(() => {
    fetchPredictions();
  }, []);

  const formatCurrency = (amount) => `MYR ${amount.toFixed(2)}`;

  const getCategoryIcon = (category) => {
    const icons = {
      'Food': '🍽️',
      'Transport': '🚗',
      'Bills': '📄',
      'Shopping': '🛒',
      'Health': '💊',
      'Education': '📚',
      'Others': '📦'
    };
    return icons[category] || '📦';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Food': 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      'Transport': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      'Bills': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      'Shopping': 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      'Health': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      'Education': 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
      'Others': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    };
    return colors[category] || colors['Others'];
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">🤖 AI Month-End Predictions</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Powered by Prophet AI • Based on {dataPoints} expense records
          </p>
        </div>
        <button
          onClick={fetchPredictions}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
          </div>
        </div>
      )}

      {predictions && Object.keys(predictions).length > 0 ? (
        <>
          {/* Predictions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Object.entries(predictions).map(([category, amount]) => (
              <div key={category} className={`p-4 rounded-lg ${getCategoryColor(category)} transition-all duration-200 hover:scale-105`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryIcon(category)}</span>
                    <span className="font-medium">{category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatCurrency(amount)}</div>
                    <div className="text-xs opacity-75">by month-end</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-gray-600 dark:text-gray-300 text-sm">Total Predicted Spending</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {formatCurrency(Object.values(predictions).reduce((sum, val) => sum + val, 0))}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Estimated by end of {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-blue-700 dark:text-blue-300 text-sm font-medium">AI Insights</div>
              <div className="text-blue-900 dark:text-blue-100 text-sm mt-1">
                {Object.keys(predictions).length > 0 && (
                  <>
                    Highest predicted category: <span className="font-semibold">
                      {Object.entries(predictions).reduce((a, b) => predictions[a[0]] > predictions[b[0]] ? a : b)[0]}
                    </span>
                  </>
                )}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                📊 Predictions update automatically with new expenses
              </div>
            </div>
          </div>
        </>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 dark:text-gray-300">AI is analyzing your spending patterns...</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🤖</div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">No predictions available yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Add more expenses to get AI predictions</p>
        </div>
      )}
    </div>
  );
}
