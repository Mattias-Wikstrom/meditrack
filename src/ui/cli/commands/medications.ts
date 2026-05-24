import { MedicationRepository } from '../../../domain/medication/MedicationRepository';
import { MedicinalProductRepository } from '../../../domain/medication/MedicinalProductRepository';
import { MedicationId } from '../../../domain/shared/IdTypes';
import { CliOutput } from '../CliOutput';

export async function listMedications(
  repo: MedicationRepository,
  output: CliOutput,
  query?: string,
): Promise<void> {
  const medications = query ? await repo.search(query) : await repo.findAll();

  if (medications.length === 0) {
    output.print('No medications found.');
    return;
  }

  for (const med of medications) {
    output.print(`${med.id}  ${med.innName}  ${med.atcCode}  ${med.form}  ${med.strength}`);
  }
}

export async function showMedication(
  medicationRepo: MedicationRepository,
  medicinalProductRepo: MedicinalProductRepository,
  output: CliOutput,
  id: string,
): Promise<void> {
  const med = await medicationRepo.findById(id as MedicationId);
  if (med === undefined) {
    output.error(`Medication not found: ${id}`);
    output.exit(1);
  }

  output.print(`${med.innName} (${med.atcCode})`);
  output.print(`Form: ${med.form}   Strength: ${med.strength}`);

  const products = await medicinalProductRepo.findByMedicationId(med.id);
  if (products.length === 0) {
    output.print('No medicinal products registered.');
    return;
  }

  output.print('\nMedicinal products:');
  for (const p of products) {
    const warning = p.isBelowThreshold ? '  *** BELOW THRESHOLD ***' : '';
    output.print(`  ${p.id}  ${p.productName}  stock: ${p.stockLevel}${warning}`);
  }
}
