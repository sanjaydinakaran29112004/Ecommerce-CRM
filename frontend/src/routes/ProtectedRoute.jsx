import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ShieldAlert } from 'lucide-react';

export function ProtectedRoute({ children, allowedRoles, requiredPermission }) {
  const { isAuthenticated, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-amber-200 p-6 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-800">Access Restricted</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Your current account role does not have authorization to view this section. Contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  // Check granular permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-amber-200 p-6 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-800">Permission Required</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            You require the <span className="font-mono text-amber-800 font-medium">"{requiredPermission}"</span> permission to perform or view this operation.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

