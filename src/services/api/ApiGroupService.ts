import { GroupService } from '../interfaces/GroupService';
import { Group } from '../../models/Group';

const API_BASE = '/api';

export class ApiGroupService implements GroupService {
  async listGroups(): Promise<Group[]> {
    try {
      const response = await fetch(`${API_BASE}/groups`);
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  }

  async getGroup(groupId: string): Promise<Group | null> {
    try {
      const response = await fetch(`${API_BASE}/groups/${groupId}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching group:', error);
      return null;
    }
  }
}
