import crypto from 'crypto';

/**
 * Token Encryption Service
 * 
 * Provides secure encryption/decryption for Facebook access tokens
 * using AES-256-GCM encryption algorithm.
 * 
 * Requirements: 8.1 - Implement token encryption
 */

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits
const ITERATIONS = 100000; // PBKDF2 iterations

interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
  salt: string;
}

/**
 * Get encryption key from environment variable
 * Falls back to a derived key if not set (not recommended for production)
 */
function getEncryptionKey(): string {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  
  if (!key) {
    console.warn(
      'TOKEN_ENCRYPTION_KEY not set. Using fallback key. ' +
      'This is NOT secure for production. Please set TOKEN_ENCRYPTION_KEY environment variable.'
    );
    // Fallback to app secret (not ideal but better than nothing)
    return process.env.FACEBOOK_APP_SECRET || 'insecure-fallback-key-change-me';
  }
  
  return key;
}

/**
 * Derive a cryptographic key from the master key using PBKDF2
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    masterKey,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
}

/**
 * Encrypt a token using AES-256-GCM
 * 
 * @param token - The plaintext token to encrypt
 * @returns Encrypted data object containing encrypted token, IV, auth tag, and salt
 */
export function encryptToken(token: string): EncryptedData {
  if (!token) {
    throw new Error('Token cannot be empty');
  }

  try {
    // Generate random salt for key derivation
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Derive encryption key from master key
    const masterKey = getEncryptionKey();
    const key = deriveKey(masterKey, salt);
    
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the token
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: salt.toString('hex'),
    };
  } catch (error) {
    console.error('Token encryption failed:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypt a token using AES-256-GCM
 * 
 * @param encryptedData - The encrypted data object
 * @returns Decrypted plaintext token
 */
export function decryptToken(encryptedData: EncryptedData): string {
  if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv || !encryptedData.tag || !encryptedData.salt) {
    throw new Error('Invalid encrypted data format');
  }

  try {
    // Derive the same key using stored salt
    const masterKey = getEncryptionKey();
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const key = deriveKey(masterKey, salt);
    
    // Convert hex strings back to buffers
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt the token
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error);
    throw new Error('Failed to decrypt token. Token may be corrupted or encryption key may have changed.');
  }
}

/**
 * Serialize encrypted data to a single string for database storage
 * Format: encrypted:iv:tag:salt
 */
export function serializeEncryptedToken(encryptedData: EncryptedData): string {
  return `${encryptedData.encrypted}:${encryptedData.iv}:${encryptedData.tag}:${encryptedData.salt}`;
}

/**
 * Deserialize encrypted token string from database
 */
export function deserializeEncryptedToken(serialized: string): EncryptedData {
  const parts = serialized.split(':');
  
  if (parts.length !== 4) {
    throw new Error('Invalid serialized token format');
  }
  
  return {
    encrypted: parts[0],
    iv: parts[1],
    tag: parts[2],
    salt: parts[3],
  };
}

/**
 * High-level function to encrypt and serialize token for database storage
 */
export function encryptTokenForStorage(token: string): string {
  const encrypted = encryptToken(token);
  return serializeEncryptedToken(encrypted);
}

/**
 * High-level function to deserialize and decrypt token from database
 */
export function decryptTokenFromStorage(serialized: string): string {
  const encrypted = deserializeEncryptedToken(serialized);
  return decryptToken(encrypted);
}

/**
 * Check if a token string is encrypted (contains our format markers)
 */
export function isTokenEncrypted(token: string): boolean {
  // Encrypted tokens have 4 parts separated by colons
  // Plain tokens are typically shorter and don't have this structure
  const parts = token.split(':');
  return parts.length === 4 && parts.every(part => /^[0-9a-f]+$/i.test(part));
}

/**
 * Migrate a plain token to encrypted format
 * Useful for gradual migration of existing tokens
 */
export function migrateToEncrypted(token: string): string {
  if (isTokenEncrypted(token)) {
    return token; // Already encrypted
  }
  return encryptTokenForStorage(token);
}

/**
 * Safely get decrypted token, handling both encrypted and plain tokens
 * This allows for gradual migration
 */
export function getDecryptedToken(token: string): string {
  if (!token) {
    throw new Error('Token is required');
  }
  
  if (isTokenEncrypted(token)) {
    return decryptTokenFromStorage(token);
  }
  
  // Return plain token as-is (for backward compatibility during migration)
  return token;
}
