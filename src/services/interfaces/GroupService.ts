import { Group } from '../../models/Group';

export interface GroupService {
  listGroups(): Promise<Group[]>;
  getGroup(groupId: string): Promise<Group | null>;
}
