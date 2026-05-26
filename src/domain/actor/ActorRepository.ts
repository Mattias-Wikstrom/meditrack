import { Actor } from '../shared/Actor';

export interface ActorRepository {
  findAll(): Promise<Actor[]>;
  findById(id: string): Promise<Actor | undefined>;
  save(actor: Actor): Promise<void>;
  delete(id: string): Promise<void>;
}
