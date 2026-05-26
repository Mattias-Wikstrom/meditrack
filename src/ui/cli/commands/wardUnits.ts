import { WardUnitRepository } from '../../../domain/wardUnit/WardUnitRepository';
import { WardUnit } from '../../../domain/wardUnit/WardUnit';
import { WardUnitId } from '../../../domain/shared/IdTypes';
import { CliOutput } from '../CliOutput';

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
  repo: WardUnitRepository,
  output: CliOutput,
  id: string,
  name: string,
): Promise<void> {
  const existing = await repo.findById(id as WardUnitId);
  if (existing) {
    output.error(`Ward unit already exists: ${id}`);
    process.exit(1);
  }
  await repo.save(new WardUnit(id as WardUnitId, name));
  output.print(`Ward unit created: ${id}  name: ${name}`);
}
