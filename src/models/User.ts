export interface User {
  userId: string;
  displayName: string;
  password: string; // Only stored locally, will be removed in Cognito implementation
}

export interface SessionUser {
  userId: string;
  displayName: string;
  isGlobalAdmin?: boolean;
}
