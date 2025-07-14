import React, { useContext, useEffect, useState } from 'react';
import { ExpenseContext } from '../../context/ExpenseContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SpendingTrends({ dateRange }) {
  const { expenses } = useContext(ExpenseContext);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDark(darkMode);
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

  const totals = {};
  if (filteredExpenses && Array.isArray(filteredExpenses)) {
    filteredExpenses.forEach(e => {
      if (e && e.category && e.amount) {
        if (!totals[e.category]) totals[e.category] = 0;
        totals[e.category] += parseFloat(e.amount) || 0;
      }
    });
  }

  const totalAmount = Object.values(totals).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  
  const data = Object.keys(totals).map(key => ({ 
    name: key, 
    value: parseFloat(totals[key]) || 0,
    percentage: totalAmount > 0 ? (((parseFloat(totals[key]) || 0) / totalAmount) * 100).toFixed(1) : '0.0'
  }));

  // Enhanced color palette that works well in both light and dark modes
  const COLORS = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ];

  // Custom tooltip with better styling
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
          <p className="text-gray-900 dark:text-white font-semibold">{data.payload.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Amount: <span className="font-medium">MYR {data.value.toFixed(2)}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Percentage: <span className="font-medium">{data.payload.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label function
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill={isDark ? '#ffffff' : '#000000'} 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="500"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

 

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300">
      <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Spending Distribution by Category</h2>
      
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>No spending data available</p>
            <p className="text-sm">Add some expenses to see the distribution</p>
          </div>
        </div>
      ) : (
        <>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie 
                  data={data} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={120}
                  innerRadius={40}
                  paddingAngle={2}
                  labelLine={false}
                  label={renderCustomLabel}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke={isDark ? '#374151' : '#ffffff'}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ 
                    color: isDark ? '#ffffff' : '#000000',
                    paddingTop: '20px'
                  }}
                  formatter={(value, entry) => (
                    <span style={{ color: isDark ? '#ffffff' : '#000000' }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Summary section */}
          <div className="mt-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-gray-600 dark:text-gray-300 text-sm">Total Spending</div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  MYR {totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
            
            {/* Category breakdown */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.sort((a, b) => b.value - a.value).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-800 dark:text-white">
                      MYR {item.value.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
