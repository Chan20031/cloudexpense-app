import React, { useContext, useState } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';
import { BudgetContext } from '../context/BudgetContext';
import { IncomeContext } from '../context/IncomeContext';
import { TrendingUp, TrendingDown, DollarSign, Calendar, PieChart } from 'lucide-react';

export default function AccountsPage() {
  const { expenses } = useContext(ExpenseContext);
  const { budget } = useContext(BudgetContext);
  const { incomeEntries } = useContext(IncomeContext);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // Calculate financial data
  const totalIncome = incomeEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const netWorth = totalIncome - totalExpenses;
  const totalBudget = Number(budget) || 0;

  // Group transactions by month
  const getMonthlyData = () => {
    const monthlyData = {};
    
    // Helper to check for valid date
    const isValidDate = (d) => {
      if (!d) return false;
      const date = new Date(d.created_at || d.id);
      return date instanceof Date && !isNaN(date) && date.getFullYear() > 1970;
    };

    // Process expenses
    expenses.filter(isValidDate).forEach(expense => {
      const date = new Date(expense.created_at || expense.id);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          income: 0,
          expenses: 0,
          budget: totalBudget
        };
      }
      monthlyData[monthKey].expenses += Number(expense.amount) || 0;
    });

    // Process income
    incomeEntries.filter(isValidDate).forEach(income => {
      const date = new Date(income.created_at || income.id);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          income: 0,
          expenses: 0,
          budget: totalBudget
        };
      }
      monthlyData[monthKey].income += Number(income.amount) || 0;
    });

    // Calculate net for each month
    Object.keys(monthlyData).forEach(key => {
      monthlyData[key].net = monthlyData[key].income - monthlyData[key].expenses;
      monthlyData[key].budgetUsage = monthlyData[key].budget > 0 
        ? (monthlyData[key].expenses / monthlyData[key].budget) * 100 
        : 0;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, data]) => ({ ...data, key }));
  };

  const monthlyData = getMonthlyData();

  // Summary cards data
  const summaryCards = [
    {
      title: 'Total Assets',
      value: totalIncome,
      icon: TrendingUp,
      color: 'green',
      description: 'Total income received'
    },
    {
      title: 'Total Liabilities',
      value: totalExpenses,
      icon: TrendingDown,
      color: 'red',
      description: 'Total expenses incurred'
    },
    {
      title: 'Net Worth',
      value: netWorth,
      icon: DollarSign,
      color: netWorth >= 0 ? 'green' : 'red',
      description: 'Assets minus liabilities'
    },
    {
      title: 'Budget Allocation',
      value: totalBudget,
      icon: PieChart,
      color: 'blue',
      description: 'Total budget set'
    }
  ];

  return (
    <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Accounts Overview</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your financial position across all time periods
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${
                  card.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                  card.color === 'red' ? 'bg-red-100 dark:bg-red-900/30' :
                  card.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    card.color === 'green' ? 'text-green-600 dark:text-green-400' :
                    card.color === 'red' ? 'text-red-600 dark:text-red-400' :
                    card.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {card.title}
                </h3>
                <p className={`text-2xl font-bold ${
                  card.color === 'green' ? 'text-green-600 dark:text-green-400' :
                  card.color === 'red' ? 'text-red-600 dark:text-red-400' :
                  card.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                  'text-gray-900 dark:text-white'
                }`}>
                  MYR {card.value.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Monthly Financial Summary
            </h2>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {monthlyData.length} months tracked
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {monthlyData.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No financial data yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start adding income and expenses to see your monthly breakdown
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {monthlyData.map((month, index) => (
                <div
                  key={month.key}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {month.month}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Budget usage: {month.budgetUsage.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 text-sm">
                    <div className="text-right">
                      <p className="text-gray-600 dark:text-gray-400">Income</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        MYR {month.income.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 dark:text-gray-400">Expenses</p>
                      <p className="font-semibold text-red-600 dark:text-red-400">
                        MYR {month.expenses.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 dark:text-gray-400">Net</p>
                      <p className={`font-semibold ${
                        month.net >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        MYR {month.net.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Financial Health Indicator */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Financial Health
        </h2>
        <div className="flex items-center gap-4">
          <div className={`w-4 h-4 rounded-full ${
            netWorth >= totalBudget * 0.5 ? 'bg-green-500' :
            netWorth >= 0 ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {netWorth >= totalBudget * 0.5 ? 'Excellent' :
               netWorth >= 0 ? 'Good' : 'Needs Attention'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {netWorth >= totalBudget * 0.5 
                ? 'You\'re building wealth effectively'
                : netWorth >= 0 
                ? 'You\'re staying within budget'
                : 'Consider reducing expenses or increasing income'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

