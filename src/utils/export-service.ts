import { formatPhoneNumberForUrl } from '../lib/utils';

export function sendWhatsAppMessage(phone: string, text: string) {
  const cleanPhone = formatPhoneNumberForUrl(phone);
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
}
