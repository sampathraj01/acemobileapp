import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../interfaces/AuthService';
import { SessionUser } from '../../models/User';
import { AWS_CONFIG } from '../../config/config';

const API_BASE = AWS_CONFIG.presignApi.url;

export class ApiAuthService implements AuthService {
  private currentUser: SessionUser | null = null;

  async login(userId: string, password: string): Promise<SessionUser | null> {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password }),
      });

      if (!response.ok) {
        return null;
      }

      const user: SessionUser = await response.json();
      this.currentUser = user;

      // Store session in AsyncStorage
      await AsyncStorage.setItem('chat_app_session', JSON.stringify(user));

      return user;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    await AsyncStorage.removeItem('chat_app_session');
  }

  async getCurrentUser(): Promise<SessionUser | null> {
    const sessionJson = await AsyncStorage.getItem('chat_app_session');

    if (sessionJson) {
      try {
        const user = JSON.parse(sessionJson) as SessionUser;
        this.currentUser = user;
        return user;
      } catch {
        return null;
      }
    }

    return null;
  }

  async isAuthenticated(): Promise<boolean> {
    return (await this.getCurrentUser()) !== null;
  }
}
