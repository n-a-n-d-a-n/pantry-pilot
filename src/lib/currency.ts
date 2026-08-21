/**
 * Indian Rupee (INR / ₹) Currency Formatting Utilities
 * Adheres to Indian number grouping system (lakhs & crores)
 */

export function formatINR(
  amount: number | string | undefined | null,
  options?: {
    showPaise?: boolean;
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
  }
): string {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  
  // Decide fraction digits
  const maxDigits = options?.maximumFractionDigits !== undefined
    ? options.maximumFractionDigits
    : (options?.showPaise ? 2 : (num % 1 !== 0 ? 2 : 0));
    
  const minDigits = options?.minimumFractionDigits !== undefined
    ? options.minimumFractionDigits
    : (options?.showPaise ? 2 : 0);

  try {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: maxDigits,
      minimumFractionDigits: minDigits,
    });
    return formatter.format(num);
  } catch {
    // Fallback if Intl fails
    const formattedNum = num.toLocaleString('en-IN', {
      maximumFractionDigits: maxDigits,
      minimumFractionDigits: minDigits,
    });
    return `₹${formattedNum}`;
  }
}

/**
 * Returns formatted number only (without ₹ prefix) using Indian locale grouping
 */
export function formatINRNumber(
  amount: number | string | undefined | null,
  options?: {
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
  }
): string {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  const maxDigits = options?.maximumFractionDigits ?? (num % 1 !== 0 ? 2 : 0);
  const minDigits = options?.minimumFractionDigits ?? 0;
  
  return num.toLocaleString('en-IN', {
    maximumFractionDigits: maxDigits,
    minimumFractionDigits: minDigits,
  });
}
