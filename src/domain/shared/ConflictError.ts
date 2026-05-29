export class ConflictError extends Error {
  constructor() {
    super('Conflict: the record was modified by another operation before this one could complete');
    this.name = 'ConflictError';
  }
}
