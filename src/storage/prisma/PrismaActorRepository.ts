import { PrismaClient } from '@prisma/client';
import { Actor } from '../../domain/shared/Actor';
import { ActorRepository } from '../../domain/actor/ActorRepository';
import { ActorRole } from '../../domain/shared/ActorRole';

export class PrismaActorRepository implements ActorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Actor[]> {
    const rows = await this.prisma.actor.findMany({ orderBy: { id: 'asc' } });
    return rows.map((r) => ({ id: r.id, role: r.role as ActorRole }));
  }

  async findById(id: string): Promise<Actor | undefined> {
    const row = await this.prisma.actor.findUnique({ where: { id } });
    if (!row) return undefined;
    return { id: row.id, role: row.role as ActorRole };
  }

  async save(actor: Actor): Promise<void> {
    await this.prisma.actor.upsert({
      where: { id: actor.id },
      create: { id: actor.id, role: actor.role },
      update: { role: actor.role },
    });
  }
}
