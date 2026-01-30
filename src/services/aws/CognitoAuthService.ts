import { AuthService } from '../interfaces/AuthService';
import { SessionUser } from '../../models/User';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js';
import { AWS_CONFIG } from '../../config/config';
import { Buffer } from 'buffer';


const TOKEN_STORAGE_KEY = 'gcapp_cognito_tokens';

const userPool = new CognitoUserPool({
  UserPoolId: AWS_CONFIG.cognito.userPoolId,
  ClientId: AWS_CONFIG.cognito.userPoolClientId,
});

export class CognitoAuthService implements AuthService {

  async login(userId: string, password: string): Promise<SessionUser | null> {
    console.log('CognitoAuthService login called',userId,password);
    return new Promise((resolve) => {
      const authDetails = new AuthenticationDetails({
        Username: userId,
        Password: password,
      });

      const user = new CognitoUser({
        Username: userId,
        Pool: userPool,
      });

      user.authenticateUser(authDetails, {
        onSuccess: async (result) => {
          console.log('Cognito login successful',result);
          const idToken = result.getIdToken().getJwtToken();
          const accessToken = result.getAccessToken().getJwtToken();

          const payload = result.getIdToken().decodePayload();

          const displayName =
            payload['custom:displayName'] ||
            payload.name ||
            payload['cognito:username'];

          console.log('Storing tokens in AsyncStorage',userId,displayName);

          await AsyncStorage.setItem(
            TOKEN_STORAGE_KEY,
            JSON.stringify({
              idToken,
              accessToken,
              expiresAt: Date.now() + 3600 * 1000,
            })
          );

          resolve({
            userId,
            displayName,
          });
        },

        onFailure: (err) => {
          console.log('Cognito login failed', err);
          resolve(null);
        },
      });
    });
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  async getCurrentUser(): Promise<SessionUser | null> {
    try {
      const stored = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (!stored) return null;

      const tokens = JSON.parse(stored);
      if (Date.now() > tokens.expiresAt) return null;

      const payload = JSON.parse(
        Buffer.from(tokens.idToken.split('.')[1], 'base64').toString('utf-8')
      );


      return {
        userId: payload['cognito:username'] || payload.sub,
        displayName: payload.name || payload['custom:displayName'],
      };
    } catch {
      return null;
    }
  }

  async getIdToken(): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) return null;

    const tokens = JSON.parse(stored);
    if (Date.now() > tokens.expiresAt) return null;

    return tokens.idToken;
  } catch (error) {
    console.log('Failed to get ID token:', error);
    return null;
  }
}


  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}
