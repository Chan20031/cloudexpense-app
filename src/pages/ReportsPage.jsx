import React, { useState } from 'react';
import MonthlyReport from '../components/Reports/MonthlyReport';
import SpendingTrends from '../components/Reports/SpendingTrends';
import AIPredictions from '../components/Reports/AIPredictions';

const getToday = () => {
  const now = new Date();
  return [new Date(now.setHours(0,0,0,0)), new Date()];
};
const getThisWeek = () => {
  const now = new Date();
  const first = now.getDate() - now.getDay();
  const start = new Date(now.setDate(first));
  start.setHours(0,0,0,0);
  const end = new Date();
  return [start, end];
};
const getThisMonth = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date();
  return [start, end];
};

export default function ReportsPage() {
  const [rangeType, setRangeType] = useState('month');
  const [customRange, setCustomRange] = useState([null, null]);

  let dateRange;
  if (rangeType === 'today') dateRange = getToday();
  else if (rangeType === 'week') dateRange = getThisWeek();
  else if (rangeType === 'month') dateRange = getThisMonth();
  else dateRange = customRange;

  return (
    <div className="p-6 space-y-6 bg-white dark:bg-gray-800 shadow rounded">
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <button onClick={() => setRangeType('today')} className={`px-3 py-1 rounded ${rangeType==='today'?'bg-blue-500 text-white':'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>Today</button>
        <button onClick={() => setRangeType('week')} className={`px-3 py-1 rounded ${rangeType==='week'?'bg-blue-500 text-white':'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>This Week</button>
        <button onClick={() => setRangeType('month')} className={`px-3 py-1 rounded ${rangeType==='month'?'bg-blue-500 text-white':'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>This Month</button>
        <label className="ml-2 text-sm text-gray-700 dark:text-gray-200">Custom:</label>
        <input type="date" value={customRange[0]?.toISOString().slice(0,10) || ''} onChange={e => setCustomRange([e.target.value ? new Date(e.target.value) : null, customRange[1]])} className="px-2 py-1 rounded border" />
        <span>-</span>
        <input type="date" value={customRange[1]?.toISOString().slice(0,10) || ''} onChange={e => setCustomRange([customRange[0], e.target.value ? new Date(e.target.value) : null])} className="px-2 py-1 rounded border" />
        <button onClick={() => setRangeType('custom')} className={`px-3 py-1 rounded ${rangeType==='custom'?'bg-blue-500 text-white':'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>Apply</button>
      </div>
      <MonthlyReport dateRange={dateRange} />
      <SpendingTrends dateRange={dateRange} />
      <AIPredictions />
    </div>
  );
}
