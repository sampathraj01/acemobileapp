import { GroupService } from '../interfaces/GroupService';
import { Group } from '../../models/Group';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_GROUPS = 'chat_app_groups';
const DEFAULT_GROUP_ID = 'demo-group';

// Seeded group
const SEEDED_GROUP: Group = {
  id: DEFAULT_GROUP_ID,
  name: 'Demo Group',
  memberIds: ['person1', 'person2'],
  createdAt: new Date().toISOString(),
};

export class LocalGroupService implements GroupService {
  constructor() {
    this.initializeGroups();
  }

  private async initializeGroups(): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEY_GROUPS);
      if (!existing) {
        await AsyncStorage.setItem(
          STORAGE_KEY_GROUPS,
          JSON.stringify([SEEDED_GROUP])
        );
      }
    } catch (error) {
      console.error('Error initializing groups:', error);
    }
  }

  async listGroups(): Promise<Group[]> {
    try {
      const groupsJson = await AsyncStorage.getItem(STORAGE_KEY_GROUPS);
      if (!groupsJson) return [];

      return JSON.parse(groupsJson) as Group[];
    } catch {
      return [];
    }
  }

  async getGroup(groupId: string): Promise<Group | null> {
    const groups = await this.listGroups();
    return groups.find((g) => g.id === groupId) || null;
  }
}
