/** Pakistani mobile numbers: 03XXXXXXXXX, or +92 3XXXXXXXXX / 0092 3XXXXXXXXX. */
export function normalisePakistanMobile(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0092")) digits = digits.slice(2);
  if (digits.startsWith("92") && digits.length === 12) digits = `0${digits.slice(2)}`;
  return /^03\d{9}$/.test(digits) ? digits : null;
}

/** "03211234890" -> "0321 1234890" */
export const formatMobile = (mobile: string) => `${mobile.slice(0, 4)} ${mobile.slice(4)}`;

/** "03211234890" -> "0321 •••• 890" (the confirmation page shows a masked number). */
export const maskMobile = (mobile: string) => `${mobile.slice(0, 4)} •••• ${mobile.slice(-3)}`;
