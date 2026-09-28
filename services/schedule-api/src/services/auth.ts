import bcrypt from 'bcryptjs';
import { jwtVerify, SignJWT } from 'jose';
import { z } from 'zod';
import type { User } from '../../../shared/types/entities.js';
import { AppError } from '../errors/AppError.js';
import type { AppConfig } from './config.js';
import type { IDatabaseService } from './interfaces/IDatabaseService.js';
import type { IAuthService } from './interfaces/IAuthService.js';

const localDevelopmentSecret = 'schedule-planner-local-only-signing-secret';
const userIdSchema = z.string().uuid();
const passwordHashCost = 12;
const jwtLifetime = '1h';

interface UserRecord extends User {
  passwordHash: string;
  createdAt?: string;
  updatedAt?: string;
}

export class DatabaseAuthService implements IAuthService {
  private readonly signingKey: Uint8Array;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(private readonly database: IDatabaseService, config: AppConfig) {
    const secret = config.environment === 'Development'
      ? config.jwtSecret ?? localDevelopmentSecret
      : config.jwtSecret;
    if (!secret || new TextEncoder().encode(secret).length < 32) {
      throw new Error('JWT_SECRET must contain at least 32 bytes outside Development');
    }
    this.signingKey = new TextEncoder().encode(secret);
    this.issuer = config.jwtIssuer;
    this.audience = config.jwtAudience;
  }

  async createAccount(input: { name: string; email: string; password: string }): Promise<{ user: User; token: string }> {
    const existing = await this.database.findOne<UserRecord>('users', { email: input.email });
    if (existing) throw new AppError(409, 'CONFLICT', 'An account with this email already exists');

    const record: UserRecord = {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, passwordHashCost),
    };
    const created = await this.database.create<UserRecord>('users', record);
    const user = publicUser(created);
    return { user, token: await this.issueToken(user) };
  }

  async login(input: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const record = await this.database.findOne<UserRecord>('users', { email: input.email });
    if (!record || !(await bcrypt.compare(input.password, record.passwordHash))) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
    }
    const user = publicUser(record);
    return { user, token: await this.issueToken(user) };
  }

  async authenticate(authorization: string | null): Promise<User> {
    const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);
    if (!match) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

    let payload;
    try {
      ({ payload } = await jwtVerify(match[1], this.signingKey, {
        algorithms: ['HS256'],
        issuer: this.issuer,
        audience: this.audience,
      }));
    } catch {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired authentication token');
    }
    if (typeof payload.sub !== 'string' || !userIdSchema.safeParse(payload.sub).success ||
      typeof payload.exp !== 'number' || typeof payload.iat !== 'number') {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid authentication token');
    }

    const user = await this.getCurrentUser(payload.sub);
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Invalid authentication token');
    return user;
  }

  async getCurrentUser(userId: string): Promise<User | null> {
    if (!userIdSchema.safeParse(userId).success) return null;
    const record = await this.database.findById<UserRecord>('users', userId);
    return record ? publicUser(record) : null;
  }

  private async issueToken(user: User): Promise<string> {
    return new SignJWT({ name: user.name })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(user.id)
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setIssuedAt()
      .setExpirationTime(jwtLifetime)
      .sign(this.signingKey);
  }
}

function publicUser(record: UserRecord): User {
  return { id: record.id, name: record.name, email: record.email };
}