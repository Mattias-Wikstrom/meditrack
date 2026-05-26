import { ActorRepository } from '../../../domain/actor/ActorRepository';
import { ActorRole } from '../../../domain/shared/ActorRole';
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

export async function createActor(
  repo: ActorRepository,
  output: CliOutput,
  id: string,
  role: string,
  wardUnitId: string | undefined,
): Promise<void> {
  const validRoles = Object.values(ActorRole);
  if (!validRoles.includes(role as ActorRole)) {
    output.error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
    process.exit(1);
  }
  const actorRole = role as ActorRole;
  if (actorRole === ActorRole.Nurse && !wardUnitId) {
    output.error('--ward-unit-id is required for Nurse role.');
    process.exit(1);
  }
  if (actorRole !== ActorRole.Nurse && wardUnitId) {
    output.error('--ward-unit-id is only valid for the Nurse role.');
    process.exit(1);
  }
  const existing = await repo.findById(id);
  if (existing) {
    output.error(`Actor already exists: ${id}`);
    process.exit(1);
  }
  await repo.save({ id, role: actorRole, wardUnitId });
  output.print(`Actor created: ${id}  role: ${actorRole}${wardUnitId ? `  ward: ${wardUnitId}` : ''}`);
  output.print(`Set a password with: meditrack passwd --actor-id ${id}`);
}
