const CURRENCY_SYMBOLS = ['$', '€', '£', '¥'];
const CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'JPY', 'IDR'];

export const isCurrency = (unit?: string): boolean => {
  if (!unit) return false;
  const upperUnit = unit.toUpperCase();
  return CURRENCY_SYMBOLS.includes(unit) || CURRENCY_CODES.includes(upperUnit);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

export const formatValue = (value: number, unit?: string): string => {
  const formattedNumber = formatNumber(value);
  if (!unit) {
    return formattedNumber;
  }
  if (isCurrency(unit)) {
    if (unit.toUpperCase() === 'IDR') {
        return `Rp ${formattedNumber}`;
    }
    if (CURRENCY_SYMBOLS.includes(unit)) {
      return `${unit}${formattedNumber}`;
    }
    return `${formattedNumber} ${unit.toUpperCase()}`;
  }
  return `${formattedNumber} ${unit}`;
};