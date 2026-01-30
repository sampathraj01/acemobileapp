import { GroupService } from '../interfaces/GroupService';
import { Group } from '../../models/Group';
import { apolloClient } from './apollo-client';
import { LIST_MY_GROUPS, LIST_GROUP_MEMBERS } from './graphql';

export class AppSyncGroupService implements GroupService {
  async listGroups(): Promise<Group[]> {
    try {
      // Lambda resolver now returns full Group objects
      const { data, error } = await apolloClient.query<{ listMyGroups: Array<{ groupId: string; groupName: string; createdBy: string; createdAt: string }> }>({
        query: LIST_MY_GROUPS,
        fetchPolicy: 'network-only',
      });
      console.log('listGroups response data:', data);
      if (error) {
        console.error('GraphQL error in listGroups:', error);
        throw error;
      }

      if (!data?.listMyGroups || data.listMyGroups.length === 0) {
        return [];
      }

      // Fetch members for each group to populate memberIds
      const groupsWithMembers = await Promise.all(
        data.listMyGroups.map(async (group) => {
          try {
            // Fetch members to get member list
            const { data: membersData } = await apolloClient.query<{ listGroupMembers: any[] }>({
              query: LIST_GROUP_MEMBERS,
              variables: { groupId: group.groupId },
              fetchPolicy: 'network-only',
            });

            const memberIds = membersData?.listGroupMembers?.map((member: any) => member.userId) || [];

            return {
              id: group.groupId,
              name: group.groupName,
              memberIds,
              createdAt: group.createdAt,
            };
          } catch (error) {
            console.error(`Failed to get members for group ${group.groupId}:`, error);
            // Return group without members if member fetch fails
            return {
              id: group.groupId,
              name: group.groupName,
              memberIds: [],
              createdAt: group.createdAt,
            };
          }
        })
      );

      return groupsWithMembers;
    } catch (error) {
      console.error('Error in listGroups:', error);
      throw error;
    }
  }

  async getGroup(groupId: string): Promise<Group | null> {
    try {
      // Get all groups and find the one we want
      const groups = await this.listGroups();
      return groups.find(group => group.id === groupId) || null;
    } catch (error) {
      console.error('Error in getGroup:', error);
      throw error;
    }
  }
}