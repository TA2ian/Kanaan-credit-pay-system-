/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats phone number for URL usage (removes all non-digits).
 * Adds +963 prefix if it's a suspicious Syrian national mobile number (starting with 09...).
 */
export function formatPhoneNumberForUrl(phone: string): string {
  let clean = phone.trim().replace(/[^\d]/g, '');

  // Handle leading 00 or 0
  if (clean.startsWith('00')) {
    clean = clean.slice(2);
  } else if (clean.startsWith('0')) {
    clean = clean.slice(1);
  }

  // If it starts with 9 and is 9 digits long (common syrian format after 09 is removed)
  if (clean.length === 9 && clean.startsWith('9')) {
    clean = '963' + clean;
  }
  
  return clean;
}

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
