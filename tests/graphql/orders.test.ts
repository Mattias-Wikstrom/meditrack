import { describe, it, expect } from 'vitest';
import { graphql } from 'graphql';
import { schema } from '../../src/api/graphql/schema';
import { createTestContext } from '../helpers/createTestContext';
import { Medication } from '../../src/domain/medication/Medication';
import { MedicationForm } from '../../src/domain/medication/MedicationForm';
import { MedicationId, WardUnitId } from '../../src/domain/shared/IdTypes';
import { WardUnit } from '../../src/domain/wardUnit/WardUnit';

describe('Query.wardUnit with nested orders', () => {
  it('returns a ward unit with its orders and medication details', async () => {
    const ctx = createTestContext('nurse-1');
    await ctx.wardUnitRepo.save(new WardUnit('ward-1' as WardUnitId, 'Akuten'));
    await ctx.medicationRepo.save(
      new Medication('med-1' as MedicationId, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg'),
    );
    await ctx.createOrderUseCase.execute({
      actorId: 'nurse-1',
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });

    const result = await graphql({
      schema,
      source: /* GraphQL */ `{
        wardUnit(id: "ward-1") {
          name
          orders {
            status
            lines {
              quantity
              medication { innName }
            }
          }
        }
      }`,
      contextValue: ctx,
    });

    expect(result.errors).toBeUndefined();
    const ward = (result.data as any)?.wardUnit;
    expect(ward.name).toBe('Akuten');
    expect(ward.orders).toHaveLength(1);
    expect(ward.orders[0].lines[0].medication.innName).toBe('Paracetamol');
  });
});
