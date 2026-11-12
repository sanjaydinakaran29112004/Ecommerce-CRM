import React from 'react';
import { Badge } from '@/components/ui/Badge';

/**
 * Standard Status Chip for Orders, Leads, Tickets, and Customers
 */
export function StatusChip({ status, type = 'order', className }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  // Color mapping by domain
  let variant = 'neutral';

  if (type === 'order') {
    switch (normalized) {
      case 'DELIVERED':
      case 'PAID':
      case 'COMPLETED':
        variant = 'success';
        break;
      case 'SHIPPED':
      case 'OUT FOR DELIVERY':
      case 'CONFIRMED':
        variant = 'brand';
        break;
      case 'PROCESSING':
      case 'PACKED':
      case 'PENDING':
        variant = 'warning';
        break;
      case 'CANCELLED':
      case 'FAILED':
      case 'REFUNDED':
        variant = 'danger';
        break;
      default:
        variant = 'neutral';
    }
  } else if (type === 'lead') {
    switch (normalized) {
      case 'CONVERTED':
        variant = 'success';
        break;
      case 'QUALIFIED':
      case 'PROPOSAL':
      case 'NEGOTIATION':
        variant = 'brand';
        break;
      case 'NEW':
      case 'CONTACTED':
        variant = 'cyan';
        break;
      case 'LOST':
        variant = 'danger';
        break;
      default:
        variant = 'neutral';
    }
  } else if (type === 'ticket') {
    switch (normalized) {
      case 'RESOLVED':
      case 'CLOSED':
        variant = 'success';
        break;
      case 'IN_PROGRESS':
        variant = 'brand';
        break;
      case 'OPEN':
        variant = 'warning';
        break;
      case 'ESCALATED':
        variant = 'danger';
        break;
      default:
        variant = 'neutral';
    }
  } else if (type === 'customer') {
    switch (normalized) {
      case 'VIP':
        variant = 'purple';
        break;
      case 'RETURNING':
        variant = 'brand';
        break;
      case 'NEW':
        variant = 'cyan';
        break;
      case 'INACTIVE':
        variant = 'neutral';
        break;
      default:
        variant = 'neutral';
    }
  }

  // Format label cleanly: "OUT_FOR_DELIVERY" -> "Out For Delivery"
  const label = normalized
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Badge variant={variant} dot size="sm" className={className}>
      {label}
    </Badge>
  );
}
