import { AWS_CONFIG } from '../../config/config';
import { CognitoAuthService } from './CognitoAuthService';


export interface PresignUploadParams {
  contentType: string;
  originalFileName?: string;
}

export interface PresignUploadResult {
  key: string;
  bucket: string;
  uploadUrl: string;
  expiresIn: number;
}

export interface PresignDownloadResult {
  downloadUrl: string;
  expiresIn: number;
}

export class PresignService {
  private apiUrl: string;
  private authService: CognitoAuthService;

  constructor(apiUrl: string, authService: CognitoAuthService) {
    this.apiUrl = apiUrl;
    this.authService = authService;
  }

  /**
   * Get a presigned upload URL for an image
   */
  async presignUpload(params: PresignUploadParams): Promise<PresignUploadResult> {
    const idToken = this.authService.getIdToken();
    
    if (!idToken) {
      throw new Error('Not authenticated. Please log in.');
    }

    try {
      let response: Response;
      try {
        response = await fetch(`${this.apiUrl}/presign/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            contentType: params.contentType,
            fileName: params.originalFileName,
          }),
        });
      } catch (fetchError: any) {
        // Handle network errors
        if (fetchError?.message?.includes('Failed to fetch') || fetchError?.name === 'TypeError') {
          throw new Error('No internet connection. Please check your network and try again.');
        }
        throw fetchError;
      }

      if (response.status === 401 || response.status === 403) {
        // Token expired or invalid - force logout
        console.error('Presign API authentication failed - token expired');
        await this.authService.logout();
        window.location.href = '/login';
        throw new Error('Authentication expired. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to get presigned upload URL: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        key: data.key,
        bucket: data.bucket,
        uploadUrl: data.uploadUrl,
        expiresIn: data.expiresIn || 900,
      };
    } catch (error: any) {
      if (error.message?.includes('Authentication expired')) {
        throw error; // Re-throw auth errors
      }
      console.error('Error getting presigned upload URL:', error);
      throw new Error(error.message || 'Failed to get presigned upload URL');
    }
  }

  /**
   * Get a presigned download URL for an image
   */
  async presignDownload(key: string): Promise<PresignDownloadResult> {
    const idToken = await this.authService.getIdToken();
    
    if (!idToken) {
      throw new Error('Not authenticated. Please log in.');
    }

    try {
      let response: Response;
      try {
        response = await fetch(`${this.apiUrl}/presign/download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ key }),
        });
      } catch (fetchError: any) {
        // Handle network errors
        if (fetchError?.message?.includes('Failed to fetch') || fetchError?.name === 'TypeError') {
          throw new Error('No internet connection. Please check your network and try again.');
        }
        throw fetchError;
      }

      if (response.status === 401 || response.status === 403) {
        // Token expired or invalid - force logout
        console.error('Presign API authentication failed - token expired');
        await this.authService.logout();
        window.location.href = '/login';
        throw new Error('Authentication expired. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to get presigned download URL: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        downloadUrl: data.downloadUrl,
        expiresIn: data.expiresIn || 900,
      };
    } catch (error: any) {
      if (error.message?.includes('Authentication expired')) {
        throw error; // Re-throw auth errors
      }
      console.error('Error getting presigned download URL:', error);
      throw new Error(error.message || 'Failed to get presigned download URL');
    }
  }
}
