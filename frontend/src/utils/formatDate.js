import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

/**
 * Parses and formats an ISO date string into human readable format
 * e.g., "12 Nov 2026, 02:30 PM"
 */
export function formatDate(dateString, pattern = 'dd MMM yyyy, hh:mm a') {
  if (!dateString) return '—';
  
  const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
  if (!isValid(date)) return '—';
  
  return format(date, pattern);
}

/**
 * Returns relative time ago (e.g. "5 mins ago", "2 hours ago")
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '—';
  const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
  if (!isValid(date)) return '—';
  return formatDistanceToNow(date, { addSuffix: true });
}
