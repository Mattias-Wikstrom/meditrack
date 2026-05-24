import { MedicationRepository } from '../../../domain/medication/MedicationRepository';
import { MedicinalProductRepository } from '../../../domain/medication/MedicinalProductRepository';
import { MedicationId } from '../../../domain/shared/IdTypes';

export function listMedications(repo: MedicationRepository, query?: string): void {
  const medications = query ? repo.search(query) : repo.findAll();

  if (medications.length === 0) {
    console.log('No medications found.');
    return;
  }

  for (const med of medications) {
    console.log(`${med.id}  ${med.innName}  ${med.atcCode}  ${med.form}  ${med.strength}`);
  }
}

export function showMedication(
  medicationRepo: MedicationRepository,
  medicinalProductRepo: MedicinalProductRepository,
  id: string,
): void {
  const med = medicationRepo.findById(id as MedicationId);
  if (med === undefined) {
    console.error(`Medication not found: ${id}`);
    process.exit(1);
  }

  console.log(`${med.innName} (${med.atcCode})`);
  console.log(`Form: ${med.form}   Strength: ${med.strength}`);

  const products = medicinalProductRepo.findByMedicationId(med.id);
  if (products.length === 0) {
    console.log('No medicinal products registered.');
    return;
  }

  console.log('\nMedicinal products:');
  for (const p of products) {
    const warning = p.isBelowThreshold ? '  *** BELOW THRESHOLD ***' : '';
    console.log(`  ${p.id}  ${p.productName}  stock: ${p.stockLevel}${warning}`);
  }
}
