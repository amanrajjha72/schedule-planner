import type { User } from '../../../../shared/types/entities.js';

export interface AuthenticatedUser extends User {
  email: string;
}

export interface IAuthService {
  createAccount(input: { name: string; email: string; password: string }): Promise<{ user: User; token: string }>;
  login(input: { email: string; password: string }): Promise<{ user: User; token: string }>;
  authenticate(authorization: string | null): Promise<User>;
  getCurrentUser(userId: string): Promise<User | null>;
}