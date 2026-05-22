import { describe, it, expect, beforeEach } from 'vitest';
import { graphql } from 'graphql';
import { schema } from '../../src/graphql/schema';
import { createTestContext } from '../helpers/createTestContext';
import { Medication } from '../../src/domain/medication/Medication';
import { MedicationForm } from '../../src/domain/medication/MedicationForm';

describe('Query.medications', () => {
  it('returns an empty list when there are no medications', async () => {
    const result = await graphql({ schema, source: '{ medications { id } }', contextValue: createTestContext() });

    expect(result.errors).toBeUndefined();
    expect(result.data?.medications).toEqual([]);
  });

  it('returns all medications when no search query is given', async () => {
    const ctx = createTestContext();
    ctx.medicationRepo.save(new Medication('med-1', 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg', 10, 20));
    ctx.medicationRepo.save(new Medication('med-2', 'Ibuprofen', 'M01AE01', MedicationForm.Tablet, '400mg', 50, 10));

    const result = await graphql({ schema, source: '{ medications { id name } }', contextValue: ctx });

    expect(result.errors).toBeUndefined();
    expect(result.data?.medications).toHaveLength(2);
  });

  it('filters medications by name when a search query is given', async () => {
    const ctx = createTestContext();
    ctx.medicationRepo.save(new Medication('med-1', 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg', 10, 20));
    ctx.medicationRepo.save(new Medication('med-2', 'Ibuprofen', 'M01AE01', MedicationForm.Tablet, '400mg', 50, 10));

    const result = await graphql({
      schema,
      source: '{ medications(query: "para") { name } }',
      contextValue: ctx,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.medications).toEqual([{ name: 'Paracetamol' }]);
  });

  it('returns isBelowThreshold correctly', async () => {
    const ctx = createTestContext();
    ctx.medicationRepo.save(new Medication('med-1', 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg', 5, 20));

    const result = await graphql({
      schema,
      source: '{ medications { isBelowThreshold } }',
      contextValue: ctx,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.medications[0].isBelowThreshold).toBe(true);
  });
});

describe('Query.medication', () => {
  it('returns null for an unknown id', async () => {
    const result = await graphql({
      schema,
      source: '{ medication(id: "nope") { id } }',
      contextValue: createTestContext(),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.medication).toBeNull();
  });

  it('returns the medication for a known id', async () => {
    const ctx = createTestContext();
    ctx.medicationRepo.save(new Medication('med-1', 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg', 10, 20));

    const result = await graphql({
      schema,
      source: '{ medication(id: "med-1") { name atcCode form strength stockLevel } }',
      contextValue: ctx,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.medication).toMatchObject({
      name: 'Paracetamol',
      atcCode: 'N02BE01',
      form: 'Tablet',
      strength: '500mg',
      stockLevel: 10,
    });
  });
});
