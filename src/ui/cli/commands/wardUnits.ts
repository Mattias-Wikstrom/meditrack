import { WardUnitRepository } from '../../../domain/wardUnit/WardUnitRepository';
import { CreateWardUnitUseCase } from '../../../domain/wardUnit/useCases/CreateWardUnitUseCase';
import { UpdateWardUnitUseCase } from '../../../domain/wardUnit/useCases/UpdateWardUnitUseCase';
import { DeleteWardUnitUseCase } from '../../../domain/wardUnit/useCases/DeleteWardUnitUseCase';
import { CliOutput } from '../CliOutput';
import { errorMessages } from '../errorMessages';

export async function listWardUnits(repo: WardUnitRepository, output: CliOutput): Promise<void> {
  const wardUnits = await repo.findAll();
  if (wardUnits.length === 0) {
    output.print('No ward units.');
    return;
  }
  for (const w of wardUnits) {
    output.print(`${w.id.padEnd(24)} ${w.name}`);
  }
}

export async function createWardUnit(
  useCase: CreateWardUnitUseCase,
  output: CliOutput,
  requestingActorId: string,
  id: string,
  name: string,
): Promise<void> {
  const result = await useCase.execute({ requestingActorId, id, name });
  if (result.successful) {
    output.print(`Ward unit created: ${result.value.id}  name: ${result.value.name}`);
  } else {
    result.errors.forEach((e) => output.error(errorMessages[e.code] ?? e.code));
    output.exit(1);
  }
}

export async function updateWardUnit(
  useCase: UpdateWardUnitUseCase,
  output: CliOutput,
  requestingActorId: string,
  id: string,
  name: string,
): Promise<void> {
  const result = await useCase.execute({ requestingActorId, id, name });
  if (result.successful) {
    output.print(`Ward unit updated: ${result.value.id}  name: ${result.value.name}`);
  } else {
    result.errors.forEach((e) => output.error(errorMessages[e.code] ?? e.code));
    output.exit(1);
  }
}

export async function deleteWardUnit(
  useCase: DeleteWardUnitUseCase,
  output: CliOutput,
  requestingActorId: string,
  id: string,
): Promise<void> {
  const result = await useCase.execute({ requestingActorId, id });
  if (result.successful) {
    output.print(`Ward unit deleted: ${id}`);
  } else {
    result.errors.forEach((e) => output.error(errorMessages[e.code] ?? e.code));
    output.exit(1);
  }
}
