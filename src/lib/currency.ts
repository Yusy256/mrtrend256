/**
 * Format a number as Uganda Shillings (UGX).
 * UGX has no decimal places by convention.
 */
export const formatUGX = (amount: number | string): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "UGX 0";
  return `UGX ${Math.round(num).toLocaleString()}`;
};
