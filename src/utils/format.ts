// src/utils/format.ts
export const SAR_SYMBOL = '﷼';

export function formatCurrency(amount: number, currency: string = 'SAR', locale: string = 'en-US') {
  const numeric = Number(amount || 0);
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);

  if ((currency || 'SAR').toUpperCase() === 'SAR') return formatted;
  return `${formatted} ${(currency || '').toUpperCase()}`.trim();
}

export function formatCurrencyWithSymbol(amount: number, currency: string = 'SAR', locale: string = 'en-US') {
  const code = (currency || 'SAR').toUpperCase();
  const value = formatCurrency(amount, code, locale);
  return code === 'SAR' ? `${SAR_SYMBOL} ${value}` : value;
}
