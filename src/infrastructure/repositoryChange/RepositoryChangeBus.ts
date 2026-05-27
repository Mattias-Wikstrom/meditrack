export type RepositoryChange<T = unknown> =
  | { kind: 'saved'; entityType: string; entity: T }
  | { kind: 'deleted'; entityType: string; id: unknown };

export interface RepositoryChangeBus {
  publish<T>(change: RepositoryChange<T>): void;
}
