// src/utils/format.ts
export const SAR_SYMBOL = 'SAR';
export const SAUDI_RIYAL_SYMBOL = SAR_SYMBOL;

export function formatCurrency(amount: number, currency: string = 'SAR', locale: string = 'en-US') {
  const value = Number(amount || 0);
  const formatted = value.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if ((currency || 'SAR').toUpperCase() === 'SAR') {
    return formatted;
  }

  return `${(currency || '').toUpperCase()} ${formatted}`.trim();
}

export function formatCurrencyWithSymbol(amount: number, currency: string = 'SAR', locale: string = 'en-US') {
  const code = (currency || 'SAR').toUpperCase();
  const value = formatCurrency(amount, code, locale);

  if (code === 'SAR') {
    return `${SAR_SYMBOL} ${value}`;
  }

  return value;
}
