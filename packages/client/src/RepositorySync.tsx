import { useSubscription } from 'urql';
import { gql } from '@urql/core';

const REPO_CHANGED_SUB = gql`
  subscription RepositorySync {
    repositoryChanged { entityType kind entityId }
  }
`;

/** Mounts once per app to keep the repositoryChanged graphcache handler alive. */
export function RepositorySync() {
  useSubscription({ query: REPO_CHANGED_SUB });
  return null;
}
