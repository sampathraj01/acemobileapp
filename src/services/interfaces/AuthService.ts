import { SessionUser } from '../../models/User';

export interface AuthService {
  login(userId: string, password: string): Promise<SessionUser | null>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<SessionUser | null>;
  isAuthenticated(): Promise<boolean>;
}
