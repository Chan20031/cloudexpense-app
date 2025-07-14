import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { BudgetProvider } from './context/BudgetContext';
import { CategoryBudgetProvider } from './context/CategoryBudgetContext';
import { IncomeProvider } from './context/IncomeContext';

import Sidebar from './components/Layout/Sidebar';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import BudgetPage from './pages/BudgetPage';
import ReportsPage from './pages/ReportsPage';
import AccountsPage from './pages/AccountsPage';
import SettingsPage from './pages/SettingsPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import PasswordResetPage from './pages/PasswordResetPage';

import { useAuth } from './hooks/useAuth';
import useSettings from './hooks/useSettings';

function AppContent() {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const { settings } = useSettings();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const hideSidebarPaths = ['/', '/auth', '/reset-password', '/verify-email'];
  const showSidebar = isAuthenticated && !hideSidebarPaths.includes(location.pathname);

  useEffect(() => {
    // Only apply theme if user is authenticated
    if (isAuthenticated) {
      document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {showSidebar && (
        <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
      )}

      <main
        className={`flex-1 overflow-auto transition-all duration-300 ${
          showSidebar ? (sidebarCollapsed ? 'ml-16' : 'ml-64') : ''
        }`}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/reset-password" element={<PasswordResetPage />} />

          {/* Protected Routes */}
          {isAuthenticated ? (
            <>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/budget" element={<BudgetPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </>
          ) : (
            <>
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/budget" element={<Navigate to="/" replace />} />
              <Route path="/reports" element={<Navigate to="/" replace />} />
              <Route path="/accounts" element={<Navigate to="/" replace />} />
              <Route path="/settings" element={<Navigate to="/" replace />} />
            </>
          )}

          {/* Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ExpenseProvider>
          <IncomeProvider>
            <BudgetProvider>
              <CategoryBudgetProvider>
                <AppContent />
              </CategoryBudgetProvider>
            </BudgetProvider>
          </IncomeProvider>
        </ExpenseProvider>
      </AuthProvider>
    </Router>
  );
}
