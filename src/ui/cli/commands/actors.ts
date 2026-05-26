import { ActorRepository } from '../../../domain/actor/ActorRepository';
import { CreateActorUseCase } from '../../../domain/actor/useCases/CreateActorUseCase';
import { ActorRole } from '../../../domain/shared/ActorRole';
import { CliOutput } from '../CliOutput';
import { errorMessages } from '../errorMessages';

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
  useCase: CreateActorUseCase,
  output: CliOutput,
  requestingActorId: string,
  id: string,
  role: string,
  wardUnitId: string | undefined,
  password: string,
): Promise<void> {
  const validRoles = Object.values(ActorRole);
  if (!validRoles.includes(role as ActorRole)) {
    output.error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
    output.exit(1);
    return;
  }

  const result = await useCase.execute({
    requestingActorId,
    id,
    role: role as ActorRole,
    wardUnitId,
    password,
  });

  if (result.successful) {
    output.print(`Actor created: ${id}  role: ${role}${wardUnitId ? `  ward: ${wardUnitId}` : ''}`);
  } else {
    output.error(`Failed: ${result.errors.map((e) => errorMessages[e.code]).join(' ')}`);
    output.exit(1);
  }
}
