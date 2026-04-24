/**
 * Generates a unique user code for anonymity.
 * Format: URK-XXXXX (e.g., URK-A72B9)
 */
export const generateUserCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid O, I, 0, 1 for readability
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `URK-${code}`;
};
