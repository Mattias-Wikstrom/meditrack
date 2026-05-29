import type { RepositoryChangeBus } from './RepositoryChangeBus';

export function observing<TRepo extends object>(
  repo: TRepo,
  entityType: string,
  bus: RepositoryChangeBus,
): TRepo {
  return new Proxy(repo, {
    get(target, key, receiver) {
      const original = Reflect.get(target, key, receiver);
      if (typeof original !== 'function') return original;
      if (key === 'save') {
        return async (entity: unknown) => {
          await (original as (...a: unknown[]) => unknown).call(target, entity);
          bus.publish({ kind: 'saved', entityType, entity });
        };
      }
      if (key === 'adjustStock' || key === 'advanceStatus') {
        return async (...args: unknown[]) => {
          const entity = await (original as (...a: unknown[]) => unknown).call(target, ...args);
          bus.publish({ kind: 'saved', entityType, entity });
          return entity;
        };
      }
      if (key === 'delete') {
        return async (id: unknown) => {
          await (original as (...a: unknown[]) => unknown).call(target, id);
          bus.publish({ kind: 'deleted', entityType, id });
        };
      }
      return original.bind(target);
    },
  });
}
