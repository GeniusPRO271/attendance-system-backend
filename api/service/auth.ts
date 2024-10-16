import { SECRET_KEY, TOKEN_EXPIRATION_TIME, REFRESH_TOKEN_EXPIRATION_TIME } from "../config";
import jwt from 'jsonwebtoken';
import type { AuthDTO, TokenDTO } from "../dto/auth";

export interface AuthService {
  verifyToken(uuid: string): Promise<AuthDTO>
  generateTokens(uuid: string): Promise<TokenDTO>
  readTokens(uuid: string): Promise<TokenDTO>
  deleteTokens(uuid: string): boolean
}

export class AuthServiceClass implements AuthService {
  private tokenStore: Map<string, { accessToken: string, refreshToken: string }>; // Store both tokens

  constructor() {
    this.tokenStore = new Map<string, { accessToken: string, refreshToken: string }>();
  }

  // Verifies if the provided access token is valid
  async verifyToken(uuid: string): Promise<AuthDTO> {
    const tokens = this.tokenStore.get(uuid);

    if (!tokens || !tokens.accessToken) {
      return { valid: false, message: 'Token not found' };
    }

    try {
      jwt.verify(tokens.accessToken, SECRET_KEY);
      return { valid: true, message: 'Token is valid' };
    } catch (error) {
      return { valid: false, message: 'Invalid or expired token' };
    }
  }

  // Generates a new access token and refresh token for the provided UUID and stores them
  async generateTokens(uuid: string): Promise<TokenDTO> {
    const accessToken = jwt.sign({ uuid }, SECRET_KEY, { expiresIn: TOKEN_EXPIRATION_TIME });
    const refreshToken = jwt.sign({ uuid }, SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRATION_TIME });

    this.tokenStore.set(uuid, { accessToken, refreshToken });

    return {
      token: accessToken,
      refreshToken: refreshToken,
      expiresIn: this.getAccessTokenExpirationTime(),
    };
  }

  // Reads the existing tokens for the provided UUID
  async readTokens(uuid: string): Promise<TokenDTO> {
    const tokens = this.tokenStore.get(uuid);

    if (!tokens) {
      throw new Error('Tokens not found');
    }

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.getAccessTokenExpirationTime(),
    };
  }

  deleteTokens(uuid: string): boolean {
    return this.tokenStore.delete(uuid);
  }

  // Helper function to calculate access token expiration time
  private getAccessTokenExpirationTime(): number {
    const expirationInMs = 60 * 60 * 1000; // 1 hour
    return Math.floor(Date.now() + expirationInMs);
  }

  // Helper function to calculate refresh token expiration time
  private getRefreshTokenExpirationTime(): number {
    const expirationInMs = 7 * 24 * 60 * 60 * 1000; // 1 week
    return Math.floor(Date.now() + expirationInMs);
  }
}
