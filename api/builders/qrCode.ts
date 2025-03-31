import QRCode from 'qrcode';

interface QRCodePayload {
  sessionId: string;
  timestamp: number;
  location: string;
  randomToken: string;
}

interface EncryptedPayload {
  data: string;
  hmac: string;
  iv: string;
}

class QRCodeGenerator {
  private readonly algorithm: string;
  private readonly validityDuration: number;
  private readonly salt: string;
  private cryptoKey: CryptoKey | null = null;
  private hmacKey: CryptoKey | null = null;

  constructor(secretKey: string, salt: string, validityDuration = 60000) {
    this.salt = salt;
    this.algorithm = 'AES-CTR';
    this.validityDuration = validityDuration;
    this.initializeKeys(secretKey, salt);
  }

  private async initializeKeys(password: string, salt: string): Promise<void> {
    // Convert password and salt to bytes
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);
    const saltBytes = encoder.encode(salt);

    // Derive key using PBKDF2
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBytes,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive encryption key
    this.cryptoKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 100000,
        hash: 'SHA-512'
      },
      baseKey,
      { name: 'AES-CTR', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Derive HMAC key
    this.hmacKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 100000,
        hash: 'SHA-512'
      },
      baseKey,
      { name: 'HMAC', hash: 'SHA-256', length: 256 },
      true,
      ['sign', 'verify']
    );
  }

  private async generateHMACToken(data: string): Promise<string> {
    if (!this.hmacKey) throw new Error('HMAC key not initialized');

    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign(
      'HMAC',
      this.hmacKey,
      encoder.encode(data)
    );
    return Buffer.from(signature).toString('hex');
  }

  private async encryptData(payload: QRCodePayload): Promise<{ encryptedData: string; iv: string }> {
    if (!this.cryptoKey) throw new Error('Crypto key not initialized');

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(16));

    const encoder = new TextEncoder();
    const jsonPayload = JSON.stringify(payload);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-CTR',
        counter: iv,
        length: 64
      },
      this.cryptoKey,
      encoder.encode(jsonPayload)
    );

    return {
      encryptedData: Buffer.from(encrypted).toString('hex'),
      iv: Buffer.from(iv).toString('hex')
    };
  }

  private async decryptData(encryptedData: string, iv: string): Promise<QRCodePayload> {
    if (!this.cryptoKey) throw new Error('Crypto key not initialized');

    const ivBuffer = Buffer.from(iv, 'hex');
    const encryptedBuffer = Buffer.from(encryptedData, 'hex');

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-CTR',
        counter: ivBuffer,
        length: 64
      },
      this.cryptoKey,
      encryptedBuffer
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted)) as QRCodePayload;
  }

  async generateQRCode(sessionId: string, location: string): Promise<string> {
    const timestamp = Date.now();
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const randomToken = Buffer.from(randomBytes).toString('hex');

    const payload: QRCodePayload = { sessionId, timestamp, location, randomToken };
    const { encryptedData, iv } = await this.encryptData(payload);
    const hmac = await this.generateHMACToken(encryptedData);

    const encryptedPayload: EncryptedPayload = { data: encryptedData, hmac, iv };
    return QRCode.toDataURL(JSON.stringify(encryptedPayload));
  }

  async validateQRCode(encryptedPayloadString: string): Promise<boolean> {
    try {
      const encryptedPayload: EncryptedPayload = JSON.parse(encryptedPayloadString);

      const validHmac = await this.generateHMACToken(encryptedPayload.data);
      if (encryptedPayload.hmac !== validHmac) {
        throw new Error('Invalid HMAC');
      }

      const payload = await this.decryptData(encryptedPayload.data, encryptedPayload.iv);
      const currentTime = Date.now();

      if (currentTime - payload.timestamp > this.validityDuration) {
        throw new Error('QR Code expired');
      }

      return true;
    } catch (err) {
      console.error('Error validating QR code:', err);
      return false;
    }
  }
}

export default QRCodeGenerator;
