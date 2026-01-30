import { apolloClient } from './apollo-client';
import {
  LIST_ALL_GROUPS,
  LIST_ALL_USERS,
  GET_USER_GROUP_MEMBERSHIPS,
  ADMIN_CREATE_GROUP,
  ADMIN_CREATE_USER,
  ADMIN_UPSERT_USER_PROFILE,
  ADMIN_SET_USER_GROUPS,
  ADMIN_ADD_USER_TO_GROUP,
  ADMIN_REMOVE_USER_FROM_GROUP,
  ADMIN_SET_GROUP_ROLE,
} from './graphql';

export type GroupRole = 'MEMBER' | 'ADMIN';

export interface AdminGroup {
  groupId: string;
  groupName: string;
  createdBy: string;
  createdAt: string;
}

export interface AdminUserProfile {
  userId: string;
  displayName: string;
  email: string | null;
  isGlobalAdmin: boolean;
  createdAt: string;
}

export interface AdminGroupMember {
  groupId: string;
  userId: string;
  role: GroupRole;
  addedAt: string;
}

export class AdminService {
  async listAllGroups(): Promise<AdminGroup[]> {
    const { data, errors } = await apolloClient.query<{ listAllGroups: AdminGroup[] }>({
      query: LIST_ALL_GROUPS,
      fetchPolicy: 'network-only',
    });
    if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));
    return data?.listAllGroups ?? [];
  }

  async listAllUsers(): Promise<AdminUserProfile[]> {
    const { data, errors } = await apolloClient.query<{ listAllUsers: AdminUserProfile[] }>({
      query: LIST_ALL_USERS,
      fetchPolicy: 'network-only',
    });
    if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));
    return data?.listAllUsers ?? [];
  }

  async getUserGroupMemberships(userId: string): Promise<AdminGroupMember[]> {
    const { data, errors } = await apolloClient.query<{ getUserGroupMemberships: AdminGroupMember[] }>({
      query: GET_USER_GROUP_MEMBERSHIPS,
      variables: { userId },
      fetchPolicy: 'network-only',
    });
    if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));
    return data?.getUserGroupMemberships ?? [];
  }

  async adminCreateGroup(groupName: string): Promise<AdminGroup> {
    const { data, errors } = await apolloClient.mutate<{ adminCreateGroup: AdminGroup }>({
      mutation: ADMIN_CREATE_GROUP,
      variables: { groupName },
    });
    if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));
    if (!data?.adminCreateGroup) throw new Error('adminCreateGroup returned no data');
    return data.adminCreateGroup;
  }

  async adminCreateUser(
    email: string,
    displayName: string,
    isGlobalAdmin?: boolean
  ): Promise<AdminUserProfile> {
    const { data, errors } = await apolloClient.mutate<{ adminCreateUser: AdminUserProfile }>({
      mutation: ADMIN_CREATE_USER,
      variables: { email, displayName, isGlobalAdmin: isGlobalAdmin ?? false },
    });
    if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));
    if (!data?.adminCreateUser) throw new Error('adminCreateUser returned no data');
    return data.adminCreateUser;
  }

  async adminUpsertUserProfile(
    userId: string,
    opts: { email?: string; displayName?: string; isGlobalAdmin?: boolean }
  ): Promise<AdminUserProfile> {
    const { data, errors } = await apolloClient.mutate<{ adminUpsertUserProfile: AdminUserProfile }>({
      mutation: ADMIN_UPSERT_USER_PROFILE,
      variables: { userId, ...opts },
    });
    if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));
    if (!data?.adminUpsertUserProfile) throw new Error('adminUpsertUserProfile returned no data');
    return data.adminUpsertUserProfile;
  }

  async adminSetUserGroups(
    userId: string,
    groupIds: string[],
    defaultRole: GroupRole = 'MEMBER'
  ): Promise<AdminGroupMember[]> {
    const { data, errors } = await apolloClient.mutate<{ adminSetUserGroups: AdminGroupMember[] }>({
      mutation: ADMIN_SET_USER_GROUPS,
      variables: { userId, groupIds, defaultRole },
    });
    if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));
    return data?.adminSetUserGroups ?? [];
  }

  async adminAddUserToGroup(groupId: string, userId: string, role: GroupRole): Promise<AdminGroupMember> {
    const { data, errors } = await apolloClient.mutate<{ adminAddUserToGroup: AdminGroupMember }>({
      mutation: ADMIN_ADD_USER_TO_GROUP,
      variables: { groupId, userId, role },
    });
    if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));
    if (!data?.adminAddUserToGroup) throw new Error('adminAddUserToGroup returned no data');
    return data.adminAddUserToGroup;
  }

  async adminRemoveUserFromGroup(groupId: string, userId: string): Promise<boolean> {
    const { data, errors } = await apolloClient.mutate<{ adminRemoveUserFromGroup: boolean }>({
      mutation: ADMIN_REMOVE_USER_FROM_GROUP,
      variables: { groupId, userId },
    });
    if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));
    return data?.adminRemoveUserFromGroup ?? false;
  }

  async adminSetGroupRole(groupId: string, userId: string, role: GroupRole): Promise<AdminGroupMember> {
    const { data, errors } = await apolloClient.mutate<{ adminSetGroupRole: AdminGroupMember }>({
      mutation: ADMIN_SET_GROUP_ROLE,
      variables: { groupId, userId, role },
    });
    if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));
    if (!data?.adminSetGroupRole) throw new Error('adminSetGroupRole returned no data');
    return data.adminSetGroupRole;
  }
}
