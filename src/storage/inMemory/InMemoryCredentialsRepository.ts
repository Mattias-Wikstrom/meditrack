import { Credentials, CredentialsRepository } from '../../domain/auth/CredentialsRepository';
import { InMemoryActorRepository } from './InMemoryActorRepository';

export class InMemoryCredentialsRepository implements CredentialsRepository {
  private readonly passwordHashes = new Map<string, string>();

  constructor(private readonly actorRepository: InMemoryActorRepository) {}

  async findByActorId(id: string): Promise<Credentials | undefined> {
    const hash = this.passwordHashes.get(id);
    const actor = await this.actorRepository.findById(id);
    if (hash === undefined || actor === undefined) return undefined;
    return { actorId: id, passwordHash: hash, role: actor.role, wardUnitId: actor.wardUnitId };
  }

  async setPasswordHash(actorId: string, passwordHash: string): Promise<void> {
    this.passwordHashes.set(actorId, passwordHash);
  }
}
