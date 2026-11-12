import React from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * Conditionally renders UI elements based on granular permission keys
 * e.g., <PermissionGate permission="orders.update_status"> <Button>Ship Order</Button> </PermissionGate>
 */
export function PermissionGate({ permission, children, fallback = null }) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return fallback;
  }

  return <>{children}</>;
}

