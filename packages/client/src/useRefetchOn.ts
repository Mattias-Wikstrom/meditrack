import { useSubscription } from 'urql';
import { gql } from '@urql/core';

const REPO_CHANGED_SUB = gql`
  subscription RepositoryChangedForRefetch {
    repositoryChanged { entityType kind entityId }
  }
`;

/**
 * Calls `refetch` whenever a repositoryChanged event arrives for one of
 * the given entity types. Use this on any mounted page that displays data
 * that can change while the user is looking at it.
 */
export function useRefetchOn(entityTypes: string | string[], refetch: () => void) {
  const types = new Set(Array.isArray(entityTypes) ? entityTypes : [entityTypes]);
  useSubscription({ query: REPO_CHANGED_SUB }, (_, event) => {
    if (event.repositoryChanged && types.has(event.repositoryChanged.entityType)) refetch();
    return undefined;
  });
}
