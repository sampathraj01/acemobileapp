import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  HttpLink,
  Observable
} from '@apollo/client';
import { AWS_CONFIG } from '../../config/config';
import { CognitoAuthService } from './CognitoAuthService';

const authService = new CognitoAuthService();

const httpLink = new HttpLink({
  uri: AWS_CONFIG.appSync.graphqlUrl,
});

const authLink = new ApolloLink((operation, forward) => {
  return new Observable(observer => {
    (async () => {
      try {
        const token = await authService.getIdToken();

        if (!token) {
          console.warn('❌ Apollo blocked request: No token');
          observer.complete();
          return;
        }

        operation.setContext({
          headers: {
            Authorization: token,
          },
        });

        const subscriber = forward(operation).subscribe({
          next: observer.next.bind(observer),
          error: observer.error.bind(observer),
          complete: observer.complete.bind(observer),
        });

        return () => subscriber.unsubscribe();
      } catch (error) {
        observer.error(error);
      }
    })();
  });
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
