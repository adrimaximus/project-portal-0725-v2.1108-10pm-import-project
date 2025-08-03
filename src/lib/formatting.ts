export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatValue = (value: number, unit?: string, compact = false): string => {
  const options: Intl.NumberFormatOptions = {};
  if (compact) {
    options.notation = 'compact';
    options.maximumFractionDigits = 1;
  }

  const formattedNumber = new Intl.NumberFormat('en-US', options).format(value);
  
  if (unit) {
    if (unit === '$' || unit === '€') {
      return `${unit}${formattedNumber}`;
    }
    return `${formattedNumber} ${unit}`;
  }
  
  return formattedNumber;
};