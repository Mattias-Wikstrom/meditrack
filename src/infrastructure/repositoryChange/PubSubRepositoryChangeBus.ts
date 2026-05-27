import { changePubSub } from './changePubSub';
import type { RepositoryChange, RepositoryChangeBus } from './RepositoryChangeBus';

export class PubSubRepositoryChangeBus implements RepositoryChangeBus {
  publish<T>(change: RepositoryChange<T>): void {
    changePubSub.publish(change.entityType, change as RepositoryChange<any>);
    changePubSub.publish('__all__', change as RepositoryChange<any>);
  }
}
