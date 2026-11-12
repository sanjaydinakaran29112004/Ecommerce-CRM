/**
 * Formats a monetary number into Indian Rupee format (INR, ₹)
 * Handles both minor units (paise) and major units (rupees).
 * 
 * @param {number} amount - The amount to format
 * @param {boolean} [isMinorUnit=false] - Whether amount is in paise (e.g. from MongoDB 10000 = ₹100.00)
 * @returns {string} e.g. "₹ 1,45,200.00"
 */
export function formatCurrency(amount, isMinorUnit = false) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹ 0.00';
  }
  
  const value = isMinorUnit ? amount / 100 : amount;
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
