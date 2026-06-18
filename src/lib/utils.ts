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

/**
 * Retrieves custom Gemini API headers configured from the system tools tab.
 */
export function getGeminiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const customKey = localStorage.getItem('custom_gemini_api_key');
  const customUrl = localStorage.getItem('custom_gemini_api_url');
  const disableDefault = localStorage.getItem('disable_default_gemini_key');

  if (customKey) {
    headers['x-gemini-key'] = customKey;
  }
  if (customUrl) {
    headers['x-gemini-url'] = customUrl;
  }
  if (disableDefault === 'true') {
    headers['x-disable-default-key'] = 'true';
  }
  return headers;
}

/**
 * Triggers a light haptic feedback vibration on mobile devices that support the Vibration API.
 * Uses patterns corresponding to light tap, medium impact, or success/warning/error patterns.
 * This function handles iframe & browser level permission blocks safely.
 */
export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' | 'error' = 'light') {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(12);
          break;
        case 'medium':
          navigator.vibrate(30);
          break;
        case 'success':
          // Success: Double short tap
          navigator.vibrate([20, 40, 20]);
          break;
        case 'warning':
          // Warning: One medium-long pulse
          navigator.vibrate(80);
          break;
        case 'error':
          // Error: Three fast pulses
          navigator.vibrate([60, 40, 60, 40, 60]);
          break;
        default:
          navigator.vibrate(12);
      }
    } catch (e) {
      // Ignore vibration errors caused by browser/iframe policy or security limits
      console.debug('Haptic feedback is not allowed in this environment:', e);
    }
  }
}

