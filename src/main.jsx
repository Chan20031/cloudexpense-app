
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { BudgetProvider } from './context/BudgetContext';
import { CategoryBudgetProvider } from './context/CategoryBudgetContext';
import { SettingsProvider } from './hooks/useSettings';
import './assets/styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BudgetProvider>
        <ExpenseProvider>
          <CategoryBudgetProvider>
            <SettingsProvider>
              <App />
            </SettingsProvider>
          </CategoryBudgetProvider>
        </ExpenseProvider>
      </BudgetProvider>
    </AuthProvider>
  </React.StrictMode>
);
