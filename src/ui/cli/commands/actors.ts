import { ActorRepository } from '../../../domain/actor/ActorRepository';
import { CliOutput } from '../CliOutput';

export async function listActors(repo: ActorRepository, output: CliOutput): Promise<void> {
  const actors = await repo.findAll();
  if (actors.length === 0) {
    output.print('No actors.');
    return;
  }
  for (const actor of actors) {
    output.print(`${actor.id.padEnd(24)} ${actor.role}`);
  }
}
