import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { MainLayout } from '@/layouts/MainLayout/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout/AuthLayout';

// Route Guards
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';

// Pages
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { CustomersPage } from '@/features/customers/pages/CustomersPage';
import { LeadsPage } from '@/features/leads/pages/LeadsPage';
import { ProductsPage } from '@/features/products/pages/ProductsPage';
import { OrdersPage } from '@/features/orders/pages/OrdersPage';
import { SupportTicketsPage } from '@/features/support/pages/SupportTicketsPage';
import { CampaignsPage } from '@/features/campaigns/pages/CampaignsPage';
import { TasksPage } from '@/features/tasks/pages/TasksPage';
import { ReturnsPage } from '@/features/returns/pages/ReturnsPage';
import { ReportsPage } from '@/features/reports/pages/ReportsPage';
import { EmployeesPage } from '@/features/employees/pages/EmployeesPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected CRM Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/support" element={<SupportTicketsPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
