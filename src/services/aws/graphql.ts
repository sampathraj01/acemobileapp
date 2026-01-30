import { gql } from '@apollo/client';

// GraphQL Queries
export const GET_MY_PROFILE = gql`
  query GetMyProfile {
    getMyProfile {
      userId
      displayName
      isGlobalAdmin
    }
  }
`;

export const LIST_MY_GROUPS = gql`
  query ListMyGroups {
    listMyGroups {
      groupId
      groupName
      createdBy
      createdAt
    }
  }
`;

export const LIST_MESSAGES = gql`
  query ListMessages($groupId: ID!, $limit: Int, $nextToken: String) {
    listMessages(groupId: $groupId, limit: $limit, nextToken: $nextToken) {
      items {
        messageId
        groupId
        senderId
        senderDisplayName
        text
        attachments {
          bucket
          key
          contentType
          originalFileName
          sizeBytes
          uploadedAt
        }
        createdAt
      }
      nextToken
    }
  }
`;

export const LIST_GROUP_MEMBERS = gql`
  query ListGroupMembers($groupId: ID!) {
    listGroupMembers(groupId: $groupId) {
      groupId
      userId
      role
      addedAt
    }
  }
`;

// GraphQL Mutations
export const UPSERT_MY_PROFILE = gql`
  mutation UpsertMyProfile($displayName: String!) {
    upsertMyProfile(displayName: $displayName) {
      userId
      displayName
      isGlobalAdmin
    }
  }
`;

export const CREATE_GROUP = gql`
  mutation CreateGroup($groupName: String!) {
    createGroup(groupName: $groupName) {
      groupId
      groupName
      createdBy
      createdAt
    }
  }
`;

export const ADD_USER_TO_GROUP = gql`
  mutation AddUserToGroup($groupId: ID!, $userId: ID!, $role: GroupRole!) {
    addUserToGroup(groupId: $groupId, userId: $userId, role: $role) {
      groupId
      userId
      role
      addedAt
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($groupId: ID!, $text: String, $attachments: [AttachmentInput!]) {
    sendMessage(groupId: $groupId, text: $text, attachments: $attachments) {
      messageId
      groupId
      senderId
      senderDisplayName
      text
      attachments {
        bucket
        key
        contentType
        originalFileName
        sizeBytes
        uploadedAt
      }
      createdAt
    }
  }
`;

// Stage 6: Admin operations (global admin only, enforced in Lambda)
export const LIST_ALL_GROUPS = gql`
  query ListAllGroups { listAllGroups { groupId groupName createdBy createdAt } }
`;
export const LIST_ALL_USERS = gql`
  query ListAllUsers { listAllUsers { userId displayName email isGlobalAdmin createdAt } }
`;
export const GET_USER_GROUP_MEMBERSHIPS = gql`
  query GetUserGroupMemberships($userId: ID!) {
    getUserGroupMemberships(userId: $userId) { groupId userId role addedAt }
  }
`;
export const ADMIN_CREATE_GROUP = gql`
  mutation AdminCreateGroup($groupName: String!) {
    adminCreateGroup(groupName: $groupName) { groupId groupName createdBy createdAt }
  }
`;
export const ADMIN_CREATE_USER = gql`
  mutation AdminCreateUser($email: String!, $displayName: String!, $isGlobalAdmin: Boolean) {
    adminCreateUser(email: $email, displayName: $displayName, isGlobalAdmin: $isGlobalAdmin) {
      userId displayName email isGlobalAdmin createdAt
    }
  }
`;
export const ADMIN_UPSERT_USER_PROFILE = gql`
  mutation AdminUpsertUserProfile($userId: ID!, $email: String, $displayName: String, $isGlobalAdmin: Boolean) {
    adminUpsertUserProfile(userId: $userId, email: $email, displayName: $displayName, isGlobalAdmin: $isGlobalAdmin) {
      userId displayName email isGlobalAdmin createdAt
    }
  }
`;
export const ADMIN_SET_USER_GROUPS = gql`
  mutation AdminSetUserGroups($userId: ID!, $groupIds: [ID!]!, $defaultRole: GroupRole) {
    adminSetUserGroups(userId: $userId, groupIds: $groupIds, defaultRole: $defaultRole) {
      groupId userId role addedAt
    }
  }
`;
export const ADMIN_ADD_USER_TO_GROUP = gql`
  mutation AdminAddUserToGroup($groupId: ID!, $userId: ID!, $role: GroupRole!) {
    adminAddUserToGroup(groupId: $groupId, userId: $userId, role: $role) {
      groupId userId role addedAt
    }
  }
`;
export const ADMIN_REMOVE_USER_FROM_GROUP = gql`
  mutation AdminRemoveUserFromGroup($groupId: ID!, $userId: ID!) {
    adminRemoveUserFromGroup(groupId: $groupId, userId: $userId)
  }
`;
export const ADMIN_SET_GROUP_ROLE = gql`
  mutation AdminSetGroupRole($groupId: ID!, $userId: ID!, $role: GroupRole!) {
    adminSetGroupRole(groupId: $groupId, userId: $userId, role: $role) {
      groupId userId role addedAt
    }
  }
`;

// GraphQL Subscriptions
export const ON_MESSAGE_SENT = gql`
  subscription OnMessageSent($groupId: ID!) {
    onMessageSent(groupId: $groupId) {
      messageId
      groupId
      senderId
      senderDisplayName
      text
      attachments {
        bucket
        key
        contentType
        originalFileName
        sizeBytes
        uploadedAt
      }
      createdAt
    }
  }
`;

// Type definitions for GraphQL responses
export interface UserProfile {
  userId: string;
  displayName: string;
  isGlobalAdmin: boolean;
}

export interface Group {
  groupId: string;
  groupName: string;
  createdBy: string;
  createdAt: string;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: 'MEMBER' | 'ADMIN';
  addedAt: string;
}

export interface Attachment {
  bucket: string;
  key: string;
  contentType: string;
  originalFileName?: string;
  sizeBytes?: number;
  uploadedAt: string;
}

export interface Message {
  messageId: string;
  groupId: string;
  senderId: string;
  senderDisplayName: string;
  text?: string | null;
  attachments?: Attachment[] | null;
  createdAt: string;
}

export interface MessageConnection {
  items: Message[];
  nextToken?: string;
}