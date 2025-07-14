
export const formatCurrency = (amount, symbol = 'RM') => {
  return `${symbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
