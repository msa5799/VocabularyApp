import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

/**
 * Hash a password using SHA-256
 * @param password - Plain text password
 * @returns Hashed password
 */
// Simple hash function for web platform when Web Crypto API is not available
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

export async function hashPassword(password: string): Promise<string> {
  try {
    console.log('hashPassword called for platform:', Platform.OS);
    if (Platform.OS === 'web') {
      console.log('Checking Web Crypto API availability');
      
      // Try Web Crypto API first
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        try {
          console.log('Using Web Crypto API');
          const encoder = new TextEncoder();
          const data = encoder.encode(password);
          console.log('Password encoded, calling crypto.subtle.digest');
          const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
          console.log('Hash buffer created');
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          console.log('Hash created successfully with Web Crypto API');
          return hashHex;
        } catch (cryptoError) {
          console.log('Web Crypto API failed, falling back to simple hash:', cryptoError);
        }
      }
      
      // Fallback to simple hash for web
      console.log('Using simple hash fallback for web');
      const hash = simpleHash(password + 'vocabulary_app_salt');
      console.log('Simple hash created successfully');
      return hash;
    } else {
      console.log('Using expo-crypto');
      // Use expo-crypto for native platforms
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      console.log('Expo crypto hash created successfully');
      return hashedPassword;
    }
  } catch (error) {
    console.error('Password hashing failed:', error);
    throw new Error(`Şifre hashleme işlemi başarısız: ${error}`);
  }
}

/**
 * Verify a password against its hash
 * @param password - Plain text password
 * @param hash - Stored password hash
 * @returns True if password matches hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const hashedPassword = await hashPassword(password);
    return hashedPassword === hash;
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
}

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns True if email format is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and message
 */
export function validatePassword(password: string): { isValid: boolean; message: string } {
  if (password.length < 6) {
    return {
      isValid: false,
      message: 'Şifre en az 6 karakter olmalıdır'
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      message: 'Şifre çok uzun'
    };
  }

  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      message: 'Şifre en az bir harf ve bir rakam içermelidir'
    };
  }

  return {
    isValid: true,
    message: 'Şifre geçerli'
  };
}

/**
 * Validate username
 * @param username - Username to validate
 * @returns Object with validation result and message
 */
export function validateUsername(username: string): { isValid: boolean; message: string } {
  if (username.length < 3) {
    return {
      isValid: false,
      message: 'Kullanıcı adı en az 3 karakter olmalıdır'
    };
  }

  if (username.length > 20) {
    return {
      isValid: false,
      message: 'Kullanıcı adı en fazla 20 karakter olabilir'
    };
  }

  // Only allow alphanumeric characters and underscores
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      message: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'
    };
  }

  return {
    isValid: true,
    message: 'Kullanıcı adı geçerli'
  };
}