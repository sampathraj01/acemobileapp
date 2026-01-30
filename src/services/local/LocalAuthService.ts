import { AuthService } from '../interfaces/AuthService';
import { User, SessionUser } from '../../models/User';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_USERS = 'chat_app_users';
const STORAGE_KEY_SESSION = 'chat_app_session';

// Seeded users
const SEEDED_USERS: User[] = [
  { userId: 'person1', password: 'password1', displayName: 'Person One' },
  { userId: 'person2', password: 'password2', displayName: 'Person Two' },
];

export class LocalAuthService implements AuthService {

  constructor() {
    this.initializeUsers();
  }

  private async initializeUsers(): Promise<void> {
    const existing = await AsyncStorage.getItem(STORAGE_KEY_USERS);
    if (!existing) {
      await AsyncStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(SEEDED_USERS));
    }
  }

  async login(userId: string, password: string): Promise<SessionUser | null> {
    const usersJson = await AsyncStorage.getItem(STORAGE_KEY_USERS);
    if (!usersJson) return null;

    const users: User[] = JSON.parse(usersJson);
    const user = users.find(
      (u) => u.userId === userId && u.password === password
    );

    if (!user) return null;

    const session: SessionUser = {
      userId: user.userId,
      displayName: user.displayName,
    };

    await AsyncStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));

    return session;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY_SESSION);
  }

  async getCurrentUser(): Promise<SessionUser | null> {
    const sessionJson = await AsyncStorage.getItem(STORAGE_KEY_SESSION);
    if (!sessionJson) return null;

    try {
      return JSON.parse(sessionJson) as SessionUser;
    } catch {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}
