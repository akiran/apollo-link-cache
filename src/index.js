import {
  ApolloLink,
  Observable,
} from 'apollo-link';

import {
  hasDirectives,
} from 'apollo-utilities';
import { graphql } from 'graphql-anywhere/lib/async';
import { merge } from 'lodash';

import {
  removeCacheSetsFromDocument,
  getCacheSetsFromDocument,
} from './utils';

export const createCacheLink = (
  cacheLinkConfig = { resolvers: {} },
) => {
  // console.log(cacheLinkConfig, 'cacheLinkConfig')
  const { resolvers } = cacheLinkConfig;

  return new class CacheLink extends ApolloLink {

    request(
      operation,
      forward,
    ) {
      const isCache = hasDirectives(['cache'], operation.query);
      // console.log('isCache!!!', isCache)
      if (!isCache) return forward(operation);

      const server = removeCacheSetsFromDocument(operation.query);

      const resolver = (fieldName, rootValue = {}, args, context, info) => {
        // console.log(fieldName, rootValue, context, 'context')
        const fieldValue = rootValue[fieldName];

        if (fieldValue !== undefined) return fieldValue;
        const resolve = resolvers[fieldName];
        // console.log('resolve', resolve)
        if (resolve) {
          // console.log('before resolve')
          const val = resolve(rootValue, args, context, info);
          // console.log('val', val)
          return val
        }
      };

      return new Observable(observer => {
        const cacheQuery = getCacheSetsFromDocument(operation.query);
        if (server) operation.query = server;
        const obs =
          server && forward
            ? forward(operation)
            : Observable.of({
                data: {},
              });

        const observerErrorHandler = observer.error.bind(observer);

        const sub = obs.subscribe({
          next: ({ data, errors }) => {
            const context = operation.getContext();
            graphql(resolver, cacheQuery, data, context, operation.variables)
              .then(nextData => {
                const finalData = merge({}, data, nextData)
                observer.next({
                  data: finalData,
                  errors,
                });
                observer.complete();
              })
              .catch(observerErrorHandler);
          },
          error: observerErrorHandler,
        });

        return () => {
          if (sub) sub.unsubscribe();
        };
      });
    }
  }();
};
