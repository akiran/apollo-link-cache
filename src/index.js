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

export const withClientState = (
  cacheLinkConfig = { resolvers: {} },
) => {
  const { resolvers } = cacheLinkConfig;

  return new class CacheLink extends ApolloLink {

    request(
      operation,
      forward,
    ) {
      const isCache = hasDirectives(['cache'], operation.query);

      if (!isCache) return forward(operation);

      const server = removeCacheSetsFromDocument(operation.query);

      const resolver = (fieldName, rootValue = {}, args, context, info) => {
        const fieldValue = rootValue[fieldName];

        if (fieldValue !== undefined) return fieldValue;

        const resolve = resolvers[fieldName];
        if (resolve) return resolve(rootValue, args, context, info);
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
