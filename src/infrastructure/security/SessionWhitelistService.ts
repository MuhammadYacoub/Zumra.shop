import jwt from 'jsonwebtoken';
import { Logger } from '../logging/logger';

export interface UserTokenPayload {
  userId: string;
  role: string;
  phone: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export class SessionWhitelistService {
  private static instance: SessionWhitelistService;
  // Active session whitelist (In-memory storage for local dev / Redis provider ready)
  private activeSessions: Map<string, { userId: string; createdAt: Date }> = new Map();

  private secretKey: string;

  private constructor() {
    this.secretKey = process.env.JWT_SECRET || 'zumra_super_secret_jwt_key_2026_change_in_production';
  }

  public static getInstance(): SessionWhitelistService {
    if (!SessionWhitelistService.instance) {
      SessionWhitelistService.instance = new SessionWhitelistService();
    }
    return SessionWhitelistService.instance;
  }

  public generateToken(user: { userId: string; role: string; phone: string }): { token: string; sessionId: string } {
    const sessionId = `SESS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const payload: UserTokenPayload = {
      userId: user.userId,
      role: user.role,
      phone: user.phone,
      sessionId,
    };

    const token = jwt.sign(payload, this.secretKey, { expiresIn: '1d' });

    // Store in active whitelist
    this.activeSessions.set(sessionId, { userId: user.userId, createdAt: new Date() });

    Logger.info(`Generated JWT token and added session to whitelist`, {
      context: 'SessionWhitelistService',
      userId: user.userId,
      sessionId,
    });

    return { token, sessionId };
  }

  public verifyToken(token: string): UserTokenPayload {
    try {
      const decoded = jwt.verify(token, this.secretKey) as UserTokenPayload;

      // Verify active session exists in whitelist (Redis / In-Memory check)
      const activeSession = this.activeSessions.get(decoded.sessionId);
      if (!activeSession) {
        throw new Error('Session has been revoked or expired from whitelist.');
      }

      return decoded;
    } catch (err: unknown) {
      const error = err as Error;
      Logger.warn(`JWT verification failed: ${error.message}`, { context: 'SessionWhitelistService' });
      throw new Error(`Authentication Failed: ${error.message}`);
    }
  }

  public revokeSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
    Logger.info(`Revoked session ${sessionId} from whitelist`, { context: 'SessionWhitelistService', sessionId });
  }

  public isSessionActive(sessionId: string): boolean {
    return this.activeSessions.has(sessionId);
  }
}
