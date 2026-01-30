import { AuthService } from './interfaces/AuthService';
import { GroupService } from './interfaces/GroupService';
import { MessageService } from './interfaces/MessageService';

import { LocalAuthService } from './local/LocalAuthService';
import { LocalGroupService } from './local/LocalGroupService';
import { LocalMessageService } from './local/LocalMessageService';

import { ApiAuthService } from './api/ApiAuthService';
import { ApiGroupService } from './api/ApiGroupService';
import { ApiMessageService } from './api/ApiMessageService';

import { CognitoAuthService } from './aws/CognitoAuthService';
import { AppSyncGroupService } from './aws/AppSyncGroupService';
import { AppSyncMessageService } from './aws/AppSyncMessageService';

export type ServiceConfig = 'local' | 'api' | 'aws';

const SERVICE_CONFIG: ServiceConfig = 'aws'; 

export function createAuthService(): AuthService {
  switch (SERVICE_CONFIG) {
    case 'local':
      return new LocalAuthService();
    case 'api':
      return new ApiAuthService();
    case 'aws':
      return new CognitoAuthService();
    default:
      return new LocalAuthService();
  }
}

export function createGroupService(): GroupService {
  switch (SERVICE_CONFIG) {
    case 'local':
      return new LocalGroupService();
    case 'api':
      return new ApiGroupService();
    case 'aws':
      return new AppSyncGroupService();
    default:
      return new LocalGroupService();
  }
}

export function createMessageService(): MessageService {
  switch (SERVICE_CONFIG) {
    case 'local':
      return new LocalMessageService();
    case 'api':
      return new ApiMessageService();
    case 'aws':
      return new AppSyncMessageService();
    default:
      return new LocalMessageService();
  }
}
