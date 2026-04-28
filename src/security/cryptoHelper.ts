import CryptoJS from 'crypto-js';

// In a real application, this secret key should NOT be hardcoded on the client.
// It should be fetched securely after user authentication or derived from a user's password.
// For the purpose of scaffolding this module, we use a constant.
const SECRET_KEY = 'Urkio-Private-Security-Key-2026';

export const encryptMessage = (plainText: string): string => {
  try {
    return CryptoJS.AES.encrypt(plainText, SECRET_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
};

export const decryptMessage = (cipherText: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
};
