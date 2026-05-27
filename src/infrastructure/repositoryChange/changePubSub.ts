import { createPubSub } from 'graphql-yoga';
import type { RepositoryChange } from './RepositoryChangeBus';

export const changePubSub = createPubSub<Record<string, [RepositoryChange<any>]>>();
