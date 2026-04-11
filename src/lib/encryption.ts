/**
 * Simple End-to-End Encryption Utility using Web Crypto API
 * This provides a way to encrypt and decrypt messages locally.
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;

/**
 * Derives a cryptographic key from a password string.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a message using a password.
 * Returns a base64 string containing salt, iv, and ciphertext.
 */
export async function encryptMessage(text: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const key = await deriveKey(password, salt);
  
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );
  
  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  
  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a base64 encrypted string using a password.
 */
export async function decryptMessage(encryptedBase64: string, password: string): Promise<string> {
  try {
    const combined = new Uint8Array(
      atob(encryptedBase64).split('').map(c => c.charCodeAt(0))
    );
    
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 16 + IV_LENGTH);
    const ciphertext = combined.slice(16 + IV_LENGTH);
    
    const key = await deriveKey(password, salt);
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Decryption failed. Incorrect password or corrupted data.');
  }
}

/**
 * Checks if a string is likely an encrypted message (base64 and follows our format)
 */
export function isEncrypted(text: string): boolean {
  // Simple heuristic: check if it's a base64 string and long enough
  try {
    const decoded = atob(text);
    return decoded.length > (16 + IV_LENGTH);
  } catch {
    return false;
  }
}
