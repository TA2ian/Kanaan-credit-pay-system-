/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Combines multiple CSS class names together.
 * Simple, light implementation matching browser environment.
 */
export function cn(...inputs: (string | undefined | null | boolean | number)[]) {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Formats a number as a currency string in US Dollars ($)
 */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
  return `$${formatted}`;
}

/**
 * Formats a Gregorian date to a simple Arabic date string
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch (e) {
    return dateStr;
  }
}
