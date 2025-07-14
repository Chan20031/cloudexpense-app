import React, { useContext, useEffect, useState } from 'react';
import { ExpenseContext } from '../../context/ExpenseContext';
import { useCategoryBudgets } from '../../context/CategoryBudgetContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function MonthlyReport({ dateRange }) {
  const { expenses } = useContext(ExpenseContext);
  const { categoryBudgets } = useCategoryBudgets();

  const [axisColor, setAxisColor] = useState('#000000');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDark(darkMode);
      setAxisColor(darkMode ? '#ffffff' : '#000000');
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Filter expenses by dateRange if provided
  let filteredExpenses = expenses;
  if (dateRange && dateRange[0] && dateRange[1]) {
    filteredExpenses = expenses.filter(e => {
      const d = new Date(e.created_at || e.id);
      return d >= dateRange[0] && d <= dateRange[1];
    });
  }

  const categoryTotals = {};
  if (filteredExpenses && Array.isArray(filteredExpenses)) {
    filteredExpenses.forEach(e => {
      if (e && e.category && e.amount) {
        if (!categoryTotals[e.category]) categoryTotals[e.category] = 0;
        categoryTotals[e.category] += parseFloat(e.amount) || 0;
      }
    });
  }

  const data = categoryBudgets && typeof categoryBudgets === 'object' 
    ? Object.keys(categoryBudgets).map(cat => ({
        category: cat,
        Expense: categoryTotals[cat] || 0,
        Budget: parseFloat(categoryBudgets[cat]) || 0,
      }))
    : [];

  // Custom tooltip with better styling
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
          <p className="text-gray-900 dark:text-white font-semibold">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: MYR ${entry.value.toFixed(2)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Color scheme that works well in both light and dark modes
  const budgetColor = isDark ? '#6B7280' : '#D1D5DB'; // Gray for budget bars
  const expenseColor = isDark ? '#3B82F6' : '#2563EB'; // Blue for expense bars

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300">
      <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Expenses vs Budget by Category</h2>
      <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer>
          <BarChart 
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis 
              dataKey="category" 
              stroke={axisColor} 
              tick={{ fill: axisColor, fontSize: 12 }}
              tickLine={{ stroke: axisColor }}
              axisLine={{ stroke: axisColor }}
            />
            <YAxis 
              stroke={axisColor} 
              tick={{ fill: axisColor, fontSize: 12 }}
              tickLine={{ stroke: axisColor }}
              axisLine={{ stroke: axisColor }}
              tickFormatter={(value) => `MYR ${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ 
                color: axisColor,
                paddingTop: '20px'
              }}
            />
            <Bar 
              dataKey="Budget" 
              fill={budgetColor}
              radius={[2, 2, 0, 0]}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            />
            <Bar 
              dataKey="Expense" 
              fill={expenseColor}
              radius={[2, 2, 0, 0]}
              animationBegin={200}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Summary section */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="text-gray-600 dark:text-gray-300">Total Budget</div>
          <div className="text-lg font-semibold text-gray-800 dark:text-white">
            MYR {(categoryBudgets && typeof categoryBudgets === 'object' 
              ? Object.values(categoryBudgets).reduce((sum, val) => sum + (parseFloat(val) || 0), 0) 
              : 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="text-gray-600 dark:text-gray-300">Total Expenses</div>
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">
            MYR {Object.values(categoryTotals).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="text-gray-600 dark:text-gray-300">Remaining</div>
          <div className={`text-lg font-semibold ${
            (categoryBudgets && typeof categoryBudgets === 'object' 
              ? Object.values(categoryBudgets).reduce((sum, val) => sum + (parseFloat(val) || 0), 0) 
              : 0) - 
            Object.values(categoryTotals).reduce((sum, val) => sum + (parseFloat(val) || 0), 0) >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            MYR {(
              (categoryBudgets && typeof categoryBudgets === 'object' 
                ? Object.values(categoryBudgets).reduce((sum, val) => sum + (parseFloat(val) || 0), 0) 
                : 0) - 
              Object.values(categoryTotals).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
            ).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
