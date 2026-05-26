import { Credentials, CredentialsRepository } from '../../domain/auth/CredentialsRepository';

export class InMemoryCredentialsRepository implements CredentialsRepository {
  private readonly store = new Map<string, Credentials>();

  async findByActorId(id: string): Promise<Credentials | undefined> {
    return this.store.get(id);
  }

  async setPasswordHash(actorId: string, passwordHash: string): Promise<void> {
    const existing = this.store.get(actorId);
    if (existing) {
      this.store.set(actorId, { ...existing, passwordHash });
    }
  }
}
