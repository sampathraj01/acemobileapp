export const AWS_CONFIG = {
  region: 'ap-south-1',
  cognito: {
    userPoolId: 'ap-south-1_d1JaSACqp',
    userPoolClientId: '1bkvoh65841d47530ktmt32c93',
  },
  appSync: {
    graphqlUrl: 'https://tpz32hu5lzfp7onsucjn5hrbty.appsync-api.ap-south-1.amazonaws.com/graphql',
  },
  presignApi: {
    url: 'https://541cot18c9.execute-api.ap-south-1.amazonaws.com',
  },
} as const;