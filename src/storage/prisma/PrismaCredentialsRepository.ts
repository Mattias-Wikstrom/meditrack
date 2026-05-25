import { PrismaClient } from '@prisma/client';
import { Credentials, CredentialsRepository } from '../../domain/auth/CredentialsRepository';
import { ActorRole } from '../../domain/shared/ActorRole';

export class PrismaCredentialsRepository implements CredentialsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByActorId(id: string): Promise<Credentials | undefined> {
    const actor = await this.prisma.actor.findUnique({ where: { id } });
    if (!actor?.passwordHash) return undefined;
    return {
      actorId: actor.id,
      passwordHash: actor.passwordHash,
      role: actor.role as ActorRole,
      wardUnitId: actor.wardUnitId ?? undefined,
    };
  }

  async setPasswordHash(actorId: string, passwordHash: string): Promise<void> {
    try {
      await this.prisma.actor.update({ where: { id: actorId }, data: { passwordHash } });
    } catch {
      throw new Error('ActorNotFound');
    }
  }
}
