import crypto from 'crypto';

export class CryptoService {
  private static encryptionKey: Buffer | null = null;
  private static iv: Buffer | null = null;

  private static getEncryptionKey(): Buffer {
    if (!this.encryptionKey) {
      const key = process.env.ENCRYPTION_KEY;
      if (!key) {
        throw new Error(
          'ENCRYPTION_KEY environment variable is required for credential encryption'
        );
      }
      if (key.length < 32) {
        throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
      }
      this.encryptionKey = Buffer.from(key.slice(0, 32));
    }
    return this.encryptionKey;
  }

  static encrypt(plaintext: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  static decrypt(encrypted: string): string {
    const key = this.getEncryptionKey();
    const [ivHex, encryptedHex] = encrypted.split(':');

    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  static hashPassword(password: string): string {
    return crypto
      .createHash('sha256')
      .update(password + process.env.PASSWORD_SALT)
      .digest('hex');
  }

  static verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  static generateOAuthState(): string {
    return this.generateSecureToken(16);
  }

  static generateRefreshToken(): string {
    return this.generateSecureToken(32);
  }
}
