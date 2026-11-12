import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { MainLayout } from '@/layouts/MainLayout/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout/AuthLayout';

// Route Guards
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { ROLES } from '@/config/permissions.config';

// Pages
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { SignupPage } from '@/features/auth/pages/SignupPage';
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
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Protected CRM Routes with RBAC Route Enforcement */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Universal Core Routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/reports" element={<ReportsPage />} />

        {/* Sales-Specific Route */}
        <Route
          path="/leads"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES_EMPLOYEE]}>
              <LeadsPage />
            </ProtectedRoute>
          }
        />

        {/* Support-Specific Routes */}
        <Route
          path="/support"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUPPORT_EMPLOYEE]}>
              <SupportTicketsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/returns"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUPPORT_EMPLOYEE]}>
              <ReturnsPage />
            </ProtectedRoute>
          }
        />

        {/* Management & Admin Routes */}
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <CampaignsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <EmployeesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
