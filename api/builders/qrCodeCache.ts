import QRCode from 'qrcode';
import QRCodeGenerator from './qrCode';

interface CachedQRCode {
  qrCode: string;
  expiresAt: number;
}

class QRCodeCache {
  private cache: Map<string, CachedQRCode>;
  private readonly cleanupInterval: ReturnType<typeof setInterval>;

  constructor(cleanupIntervalMs: number = 60000) { // Cleanup every minute by default
    this.cache = new Map();

    // Start periodic cleanup of expired codes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  set(key: string, qrCode: string, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { qrCode, expiresAt });
  }

  get(key: string): string | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.qrCode;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

class CachedQRCodeGenerator {
  private readonly qrGenerator: QRCodeGenerator;
  private readonly cache: QRCodeCache;
  private readonly qrCodeTTL: number;

  constructor(
    secretKey: string,
    salt: string,
    qrCodeTTL: number = 600000, // 10 minutes in milliseconds
    cleanupInterval: number = 60000 // 1 minute in milliseconds
  ) {
    this.qrGenerator = new QRCodeGenerator(secretKey, salt, qrCodeTTL);
    this.cache = new QRCodeCache(cleanupInterval);
    this.qrCodeTTL = qrCodeTTL;
  }

  async getQRCode(sessionId: string, location: string): Promise<string> {
    // Create a unique key for this QR code request
    const cacheKey = `${sessionId}-${location}`;

    // Check cache first
    const cachedQR = this.cache.get(cacheKey);
    if (cachedQR) {
      return cachedQR;
    }

    // Generate new QR code if not in cache
    const qrCode = await this.qrGenerator.generateQRCode(sessionId, location);

    // Cache the new QR code
    this.cache.set(cacheKey, qrCode, this.qrCodeTTL);

    return qrCode;
  }

  async validateQRCode(encryptedPayloadString: string): Promise<boolean> {
    return this.qrGenerator.validateQRCode(encryptedPayloadString);
  }

  destroy(): void {
    this.cache.destroy();
  }
}

// Export the cached version as default
export default CachedQRCodeGenerator;
