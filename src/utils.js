import { DocumentNode, DirectiveNode } from 'graphql';

import {
  checkDocument,
  removeDirectivesFromDocument,
  getDirectivesFromDocument,
} from 'apollo-utilities';

const connectionRemoveConfig = {
  test: (directive) => directive.name.value === 'cache',
  remove: true,
};

const removed = new Map();
export function removeCacheSetsFromDocument(
  query,
) {
  // caching
  const cached = removed.get(query);
  if (cached) return cached;

  checkDocument(query);

  const docClone = removeDirectivesFromDocument(
    [connectionRemoveConfig],
    query,
  );

  // caching
  removed.set(query, docClone);
  return docClone;
}

const cacheQuery = new Map();
export function getCacheSetsFromDocument(query) {
  // caching
  const cached = cacheQuery.get(query);
  if (cached) return cached;

  const docClone = getDirectivesFromDocument([{ name: 'cache' }], query);

  // caching
  cacheQuery.set(query, docClone);
  return docClone;
}
