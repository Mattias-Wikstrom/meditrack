import { Actor } from '../../domain/shared/Actor';
import { ActorRepository } from '../../domain/actor/ActorRepository';

export class InMemoryActorRepository implements ActorRepository {
  private readonly store = new Map<string, Actor>();

  constructor(actors: Actor[] = []) {
    for (const actor of actors) {
      this.store.set(actor.id, actor);
    }
  }

  async findAll(): Promise<Actor[]> {
    return [...this.store.values()];
  }

  async findById(id: string): Promise<Actor | undefined> {
    return this.store.get(id);
  }

  async save(actor: Actor): Promise<void> {
    this.store.set(actor.id, actor);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
