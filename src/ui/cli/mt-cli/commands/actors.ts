import bcrypt from 'bcryptjs';
import { ActorRepository } from '../../../../domain/actor/ActorRepository';
import { CreateActorUseCase } from '../../../../domain/actor/useCases/CreateActorUseCase';
import { DeleteActorUseCase } from '../../../../domain/actor/useCases/DeleteActorUseCase';
import { CredentialsRepository } from '../../../../domain/auth/CredentialsRepository';
import { ActorRole } from '../../../../domain/shared/ActorRole';
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

export async function bootstrapCreateActor(
  actorRepo: ActorRepository,
  credentialsRepo: CredentialsRepository,
  output: CliOutput,
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

  const actorRole = role as ActorRole;

  if (actorRole !== ActorRole.Nurse && wardUnitId != null) {
    output.error('--ward-unit-id is only valid for the Nurse role.');
    output.exit(1);
    return;
  }

  const allActors = await actorRepo.findAll();
  const adminExists = allActors.some((a) => a.role === ActorRole.Admin);
  if (adminExists) {
    output.error('Bootstrap is not allowed: an admin actor already exists. Use "actors create" instead.');
    output.exit(1);
    return;
  }

  await actorRepo.save({ id, role: actorRole, wardUnitId });
  const passwordHash = await bcrypt.hash(password, 10);
  await credentialsRepo.setPasswordHash(id, passwordHash);
  output.print(`Actor created: ${id}  role: ${actorRole}${wardUnitId ? `  ward: ${wardUnitId}` : ''}`);
}

export async function deleteActor(
  useCase: DeleteActorUseCase,
  output: CliOutput,
  requestingActorId: string,
  id: string,
): Promise<void> {
  const result = await useCase.execute({ requestingActorId, id });

  if (result.successful) {
    output.print(`Actor deleted: ${id}`);
  } else {
    output.error(`Failed: ${result.errors.map((e) => errorMessages[e.code]).join(' ')}`);
    output.exit(1);
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
