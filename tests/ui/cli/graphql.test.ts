import { describe, it, expect, beforeEach } from 'vitest';
import { runGraphQL } from '../../../src/ui/cli/commands/graphql';
import { createTestContext } from '../../helpers/createTestContext';
import { RecordingOutput, ExitError } from './RecordingOutput';
import { InMemoryWardUnitRepository } from '../../../src/storage/inMemory/InMemoryWardUnitRepository';
import { Medication } from '../../../src/domain/medication/Medication';
import { MedicationForm } from '../../../src/domain/medication/MedicationForm';
import { MedicationId } from '../../../src/domain/shared/IdTypes';

describe('graphql CLI command', () => {
  let output: RecordingOutput;

  beforeEach(() => {
    output = new RecordingOutput();
  });

  it('prints JSON result for a successful query', async () => {
    const ctx = createTestContext('nurse-1');
    await ctx.medicationRepo.save(
      new Medication('med-1' as MedicationId, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg'),
    );
    const context = { ...ctx, wardUnitRepo: new InMemoryWardUnitRepository() };

    await runGraphQL(context, output, '{ medications { id innName } }');

    expect(output.messages).toHaveLength(1);
    const parsed = JSON.parse(output.messages[0]!);
    expect(parsed.data.medications[0].innName).toBe('Paracetamol');
  });

  it('exits with code 1 and prints errors for an invalid query', async () => {
    const ctx = createTestContext('nurse-1');
    const context = { ...ctx, wardUnitRepo: new InMemoryWardUnitRepository() };

    await expect(
      runGraphQL(context, output, '{ nonExistentField }'),
    ).rejects.toThrow(ExitError);

    const parsed = JSON.parse(output.messages[0]!);
    expect(parsed.errors).toBeDefined();
  });

  it('passes variables through to the query', async () => {
    const ctx = createTestContext('nurse-1');
    await ctx.medicationRepo.save(
      new Medication('med-1' as MedicationId, 'Ibuprofen', 'M01AE01', MedicationForm.Tablet, '400mg'),
    );
    const context = { ...ctx, wardUnitRepo: new InMemoryWardUnitRepository() };

    await runGraphQL(
      context,
      output,
      'query GetMedication($id: ID!) { medication(id: $id) { id innName } }',
      { id: 'med-1' },
    );

    const parsed = JSON.parse(output.messages[0]!);
    expect(parsed.data.medication.innName).toBe('Ibuprofen');
  });
});
