// src/utils/format.ts
export function formatCurrency(amount: number, currency: string = 'SAR', locale: string = 'ar-SA') {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'code'
  }).format(amount);

  if (currency === 'SAR') {
    return formatted.replace(/SAR|ر\.س\.?|﷼/g, '').trim();
  }

  return formatted;
}

export function formatCurrencyWithSymbol(amount: number, currency: string = 'SAR', locale: string = 'ar-SA') {
  const value = formatCurrency(amount, currency, locale);

  if (currency === 'SAR') {
    return `﷼ ${value}`;
  }

  return value;
}
