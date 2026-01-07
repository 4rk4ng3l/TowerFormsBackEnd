import { injectable } from 'tsyringe';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@injectable()
export class TokenService {
  private readonly jwtSecret: string;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    this.accessTokenExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

    if (this.jwtSecret === 'your-super-secret-jwt-key-change-this-in-production') {
      console.warn('WARNING: Using default JWT secret. This is insecure for production!');
    }
  }

  generateAccessToken(userId: string, email: string, role: string): string {
    const payload: TokenPayload = {
      userId,
      email,
      role
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiresIn as string | number
    } as jwt.SignOptions);
  }

  generateRefreshToken(): string {
    return uuidv4();
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  decodeToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      this.verifyAccessToken(token);
      return false;
    } catch (error) {
      if (error instanceof Error && error.message === 'Token has expired') {
        return true;
      }
      return true;
    }
  }

  getTokenExpirationDate(token: string): Date | null {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  }

  getRefreshTokenExpirationDate(): Date {
    const days = parseInt(this.refreshTokenExpiresIn.replace('d', ''), 10);
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    return expirationDate;
  }
}
