import { describe, it, expect, beforeEach } from 'vitest';
import { listMedications, showMedication } from '../../../src/ui/cli/mt-cli/commands/medications';
import { InMemoryMedicationRepository } from '../../../src/storage/inMemory/InMemoryMedicationRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { Medication } from '../../../src/domain/medication/Medication';
import { MedicinalProduct } from '../../../src/domain/medication/MedicinalProduct';
import { MedicationForm } from '../../../src/domain/medication/MedicationForm';
import { MedicationId, MedicinalProductId } from '../../../src/domain/shared/IdTypes';
import { RecordingOutput, ExitError } from './RecordingOutput';

describe('listMedications', () => {
  let medicationRepo: InMemoryMedicationRepository;
  let output: RecordingOutput;

  beforeEach(() => {
    medicationRepo = new InMemoryMedicationRepository();
    output = new RecordingOutput();
  });

  it('prints a message when there are no medications', async () => {
    await listMedications(medicationRepo, output);

    expect(output.messages).toEqual(['No medications found.']);
  });

  it('prints one line per medication', async () => {
    await medicationRepo.save(new Medication('med-1' as MedicationId, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg'));
    await medicationRepo.save(new Medication('med-2' as MedicationId, 'Ibuprofen', 'M01AE01', MedicationForm.Tablet, '400mg'));

    await listMedications(medicationRepo, output);

    expect(output.messages).toHaveLength(2);
    expect(output.messages[0]).toContain('Paracetamol');
    expect(output.messages[1]).toContain('Ibuprofen');
  });

  it('filters by query', async () => {
    await medicationRepo.save(new Medication('med-1' as MedicationId, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg'));
    await medicationRepo.save(new Medication('med-2' as MedicationId, 'Ibuprofen', 'M01AE01', MedicationForm.Tablet, '400mg'));

    await listMedications(medicationRepo, output, 'para');

    expect(output.messages).toHaveLength(1);
    expect(output.messages[0]).toContain('Paracetamol');
  });
});

describe('showMedication', () => {
  let medicationRepo: InMemoryMedicationRepository;
  let medicinalProductRepo: InMemoryMedicinalProductRepository;
  let output: RecordingOutput;

  beforeEach(() => {
    medicationRepo = new InMemoryMedicationRepository();
    medicinalProductRepo = new InMemoryMedicinalProductRepository();
    output = new RecordingOutput();
  });

  it('exits with code 1 and prints an error when the medication is not found', async () => {
    await expect(showMedication(medicationRepo, medicinalProductRepo, output, 'unknown')).rejects.toThrow(ExitError);
    expect(output.errors[0]).toContain('unknown');
  });

  it('prints the medication details', async () => {
    await medicationRepo.save(new Medication('med-1' as MedicationId, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg'));

    await showMedication(medicationRepo, medicinalProductRepo, output, 'med-1');

    expect(output.messages.some((m) => m.includes('Paracetamol'))).toBe(true);
    expect(output.messages.some((m) => m.includes('N02BE01'))).toBe(true);
  });

  it('prints a message when no medicinal products are registered', async () => {
    await medicationRepo.save(new Medication('med-1' as MedicationId, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg'));

    await showMedication(medicationRepo, medicinalProductRepo, output, 'med-1');

    expect(output.messages.some((m) => m.includes('No medicinal products'))).toBe(true);
  });

  it('lists registered medicinal products', async () => {
    await medicationRepo.save(new Medication('med-1' as MedicationId, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg'));
    await medicinalProductRepo.save(new MedicinalProduct('prod-1' as MedicinalProductId, 'Alvedon 500mg', 'med-1' as MedicationId, 10, 5));

    await showMedication(medicationRepo, medicinalProductRepo, output, 'med-1');

    expect(output.messages.some((m) => m.includes('Alvedon 500mg'))).toBe(true);
  });

  it('flags a medicinal product that is below threshold', async () => {
    await medicationRepo.save(new Medication('med-1' as MedicationId, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg'));
    await medicinalProductRepo.save(new MedicinalProduct('prod-1' as MedicinalProductId, 'Alvedon 500mg', 'med-1' as MedicationId, 3, 20));

    await showMedication(medicationRepo, medicinalProductRepo, output, 'med-1');

    expect(output.messages.some((m) => m.includes('BELOW THRESHOLD'))).toBe(true);
  });
});
